import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION } from 'modules/apartment/apartment.constants';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { filters } from 'modules/filter/filter.constants';
import { FilterDocument } from 'modules/filter/filter.schema';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { defaultPaginationParams } from 'modules/pagination/pagination.constants';
import { getSkip } from 'modules/pagination/pagination.utils';
import { FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS } from 'modules/token/token.constants';
import { TokenService } from 'modules/token/token.service';
import { Subscription } from 'modules/user/subscription.enum';
import { UserService } from 'modules/user/user.service';
import {
  DELETING_INACTIVE_APARTMENTS,
  SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB,
  SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB,
} from './tasks.constants';

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

  @Cron(CronExpression.EVERY_12_HOURS, {
    name: DELETING_INACTIVE_APARTMENTS,
  })
  async handleDeletingInactiveApartments(): Promise<void> {
    this.logCronJobStarted(DELETING_INACTIVE_APARTMENTS);

    try {
      const limitPerPage = defaultPaginationParams.limitPerPage;
      let pageNumber = defaultPaginationParams.pageNumber;
      let apartmentsIds;
      let total;

      do {
        ({
          data: apartmentsIds,
          total,
        } = await this.apartmentService.getApartmentsIds({
          limitPerPage,
          pageNumber,
        }));
        await Promise.all(
          apartmentsIds.map(id => this.handleDeletingInactiveApartment(id)),
        );
        pageNumber++;
      } while (total >= getSkip({ limitPerPage, pageNumber }));
    } catch (error) {
      this.logger.error(error);
    }

    this.logCronJobFinished(DELETING_INACTIVE_APARTMENTS);
  }

  private async handleDeletingInactiveApartment(
    apartmentId: string,
  ): Promise<void> {
    const isApartmentInactive = await this.apartmentService.isApartmentInactive(
      apartmentId,
    );
    if (!isApartmentInactive) return;

    this.logger.log(`Deleting apartment: ${apartmentId}`);
    return this.apartmentService.deleteApartment(apartmentId);
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB,
  })
  async handleSavingApartmentListFromProviders(): Promise<void> {
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
    } catch (error) {
      this.logger.error(error);
    }

    this.logCronJobFinished(SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB);
  }

  // @Cron(CronExpression.EVERY_DAY_AT_1PM, {
  //   name: SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB,
  //   timeZone: 'Europe/Belgrade',
  // })
  // async handleSendingNewApartmentsForFreeSubscriptionUsers(): Promise<void> {
  //   this.logCronJobStarted(SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB);

  //   try {
  //     const limitPerPage = defaultPaginationParams.limitPerPage;
  //     let pageNumber = defaultPaginationParams.pageNumber;
  //     let filters;
  //     let total;

  //     do {
  //       ({
  //         data: filters,
  //         total,
  //       } = await this.filterService.getFilterListBySubscriptionName(
  //         Subscription.FREE,
  //         { limitPerPage, pageNumber },
  //       ));
  //       await Promise.all(
  //         filters.map(filter => this.sendNewApartmentsByFilter(filter)),
  //       );
  //       pageNumber++;
  //     } while (total >= getSkip({ limitPerPage, pageNumber }));
  //   } catch (error) {
  //     this.logger.error(error);
  //   }

  //   this.logCronJobFinished(SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB);
  // }

  private async sendNewApartmentsByFilter(
    filter: FilterDocument,
  ): Promise<void> {
    try {
      await this.tokenService.deleteTokenByFilterId(filter._id);
      this.logger.log(`Filter: ${JSON.stringify(filter)}`);

      const apartmentList = await this.apartmentService.getApartmentListFromDatabaseByFilter(
        filter,
        RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION,
      );
      if (apartmentList.data.length === 0) {
        this.logger.log('There are no apartments to send to the user');
        return;
      }

      const newApartments = [...apartmentList.data].sort(
        (firstApartment, secondApartment) =>
          firstApartment.price - secondApartment.price,
      );

      const filterDeactivationUrl = await this.filterService.getDeactivationUrl(
        filter._id,
        FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS,
      );
      const userEmail = await this.userService.getUserEmail(filter.user);
      await this.mailService.sendMailWithNewApartments(
        userEmail,
        newApartments,
        filter as FilterDto,
        filterDeactivationUrl,
      );

      await this.userService.insertReceivedApartmentsIds(
        filter.user,
        newApartments,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  private logCronJobFinished = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job finished...`);
  };

  private logCronJobStarted = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job started...`);
  };
}
