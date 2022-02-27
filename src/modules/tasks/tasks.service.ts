import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { RECEIVED_APARTMENTS_SIZE } from 'modules/apartment/apartment.constants';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { filters } from 'modules/filter/filter.constants';
import { Filter } from 'modules/filter/filter.interface';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { defaultPaginationParams } from 'modules/pagination/pagination.constants';
import { getSkip } from 'modules/pagination/pagination.utils';
import { FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS } from 'modules/token/token.constants';
import { TokenType } from 'modules/token/token.enums';
import { TokenService } from 'modules/token/token.service';
import { Subscription } from 'modules/user/subscription.enum';
import { UserService } from 'modules/user/user.service';
import { SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB } from './tasks.constants';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly apartmentService: ApartmentService,
    private readonly filterService: FilterService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  private shouldRunCronJob() {
    return process.env?.NODE_APP_INSTANCE === '0';
  }

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB,
  })
  async handleSavingApartmentListFromProviders(): Promise<void> {
    if (!this.shouldRunCronJob()) return;

    this.logCronJobStarted(SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB);
    const saveApartmentListFromProviders = [];
    for (const filter of filters) {
      saveApartmentListFromProviders.push(
        this.apartmentService.saveApartmentListFromProviders(
          this.filterService.getInitialFilter(filter),
        ),
      );
    }

    try {
      await Promise.all(saveApartmentListFromProviders);
      await this.handleSendingNewApartments(Subscription.BETA);
    } catch (error) {
      this.logger.error(error);
    }

    this.logCronJobFinished(SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB);
  }

  @Cron(CronExpression.EVERY_10_MINUTES, {
    name: 'SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB',
    timeZone: 'Europe/Belgrade',
  })
  async handleSendingNewApartments(
    subscriptionType: Subscription = Subscription.FREE,
  ): Promise<void> {
    if (!this.shouldRunCronJob()) return;

    this.logCronJobStarted(
      `SENDING_NEW_APARTMENTS_${subscriptionType}_SUBSCRIPTION_CRON_JOB`,
    );

    try {
      const limitPerPage = defaultPaginationParams.limitPerPage;
      let pageNumber = defaultPaginationParams.pageNumber;
      let filters;
      let total;

      do {
        ({
          data: filters,
          total,
        } = await this.filterService.getFilterListBySubscriptionType(
          subscriptionType,
          { limitPerPage, pageNumber },
        ));
        await Promise.all(
          filters.map(filter =>
            this.sendNewApartmentsByFilter(filter).catch(error =>
              this.logger.error(error),
            ),
          ),
        );
        pageNumber++;
      } while (total >= getSkip({ limitPerPage, pageNumber }));
    } catch (error) {
      this.logger.error(error);
    }

    this.logCronJobFinished(
      `SENDING_NEW_APARTMENTS_${subscriptionType}_SUBSCRIPTION_CRON_JOB`,
    );
  }

  @Transactional()
  private async sendNewApartmentsByFilter(filter: Filter): Promise<void> {
    await this.tokenService.deleteTokenByFilterId(filter.id);

    const apartmentList = await this.apartmentService.getApartmentListFromDatabaseByFilter(
      filter,
      RECEIVED_APARTMENTS_SIZE,
    );
    if (apartmentList.data.length === 0) {
      return;
    }

    const newApartments = [...apartmentList.data].sort(
      (firstApartment, secondApartment) =>
        firstApartment.price - secondApartment.price,
    );

    const filterDeactivationUrl = await this.filterService.createTokenAndDeactivationUrl(
      {
        filterId: filter.id,
        userId: filter.userId,
        type: TokenType.DEACTIVATION,
      },
      FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS,
    );
    const userEmail = await this.userService.getUserEmail(filter.userId);
    await this.mailService.sendMailWithNewApartments(
      userEmail,
      newApartments,
      filter as FilterDto,
      filterDeactivationUrl,
    );

    await this.userService.insertReceivedApartments(
      filter.userId,
      newApartments,
    );
  }

  private logCronJobFinished = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job finished...`);
  };

  private logCronJobStarted = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job started...`);
  };
}
