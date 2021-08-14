import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION } from 'modules/apartment/apartment.constants';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { ApartmentListParamsDto } from 'modules/apartment/dto/apartment-list-params.dto';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { rentFilter, saleFilter } from 'modules/filter/filter.constants';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
import { Subscription } from 'modules/user/subscription.enum';
import { UserService } from 'modules/user/user.service';
import {
  DELETING_INACTIVE_APARTMENTS,
  SCRAPING_CRON_JOB,
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

  @Cron(CronExpression.EVERY_HOUR, {
    name: SCRAPING_CRON_JOB,
  })
  async handleScraping(): Promise<void> {
    this.logCronJobStarted(SCRAPING_CRON_JOB);
    const scrapeByFilters = [];
    for (const filter of [rentFilter, saleFilter]) {
      scrapeByFilters.push(
        this.apartmentService.getApartmentListFromProviders(
          FilterService.getInitialFilter(filter),
        ),
      );
    }

    try {
      await Promise.all(scrapeByFilters);
    } catch (error) {
      this.logger.error(error);
    }

    this.logCronJobFinished(SCRAPING_CRON_JOB);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1PM, {
    name: SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB,
    timeZone: 'Europe/Belgrade',
  })
  async handleSendingNewApartmentsForFreeSubscriptionUsers(): Promise<void> {
    this.logCronJobStarted(SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB);
    const filters = await this.filterService.getFilterListBySubscriptionName(
      Subscription.FREE,
    );
    if (!filters.length) {
      this.logger.log('There are no filters');
      this.logCronJobFinished(
        SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB,
      );
      return;
    }

    filters.forEach(async filter => {
      await this.tokenService.deactivateTokenByFilterId(filter._id);
      this.logger.log(`Filter: ${JSON.stringify(filter)}`);
      const receivedApartmentsIds = await this.userService.getReceivedApartmentsIds(
        filter.user,
      );

      const apartmentListParams = {
        ...filter,
        limitPerPage: RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION,
        pageNumber: 1,
      };
      const apartmentList = await this.apartmentService.getApartmentListFromDatabase(
        apartmentListParams as ApartmentListParamsDto,
        receivedApartmentsIds,
      );
      const apartmentListLength = apartmentList.data.length;
      if (apartmentListLength === 0) {
        this.logger.log('There are no apartments to send to the user');
        this.logCronJobFinished(
          SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB,
        );
        return;
      }

      const deactivationToken = await this.tokenService.createToken(24);
      Object.assign(deactivationToken, { filter: filter._id });
      await this.tokenService.saveToken(deactivationToken);
      const deactivationUrl = `${process.env.CLIENT_URL}/filters/deactivation/${deactivationToken.value}`;
      const newApartments = apartmentList.data.sort(
        (firstApartment, secondApartment) =>
          firstApartment.price - secondApartment.price,
      );
      const populatedFilter = await this.filterService.populateUser(filter);
      await this.mailService.sendMailWithNewApartments(
        // @ts-ignore
        populatedFilter.user.email,
        newApartments,
        filter as FilterDto,
        deactivationUrl,
      );

      const newApartmentsIds = newApartments.map(apartment => apartment._id);
      await this.userService.insertReceivedApartmentsIds(
        filter.user,
        newApartmentsIds,
      );

      this.logCronJobFinished(
        SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB,
      );
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS, {
    name: DELETING_INACTIVE_APARTMENTS,
  })
  async handleDeletingInactiveApartments(): Promise<void> {
    this.logCronJobStarted(DELETING_INACTIVE_APARTMENTS);

    const apartmentsIds = await this.apartmentService.getApartmentsIds();

    try {
      await Promise.all(
        apartmentsIds.map(id => this.handleDeletingInactiveApartment(id)),
      );
    } catch (error) {
      this.logger.error(error);
    }

    this.logCronJobFinished(DELETING_INACTIVE_APARTMENTS);
  }

  private handleDeletingInactiveApartment = async _id => {
    const [providerName] = _id.split('_');
    switch (providerName) {
      case 'cetiriZida': {
        await this.apartmentService.handleDeletingInactiveApartmentFromCetiriZida(
          _id,
        );
        break;
      }
      case 'cityExpert': {
        await this.apartmentService.handleDeletingInactiveApartmentFromCityExpert(
          _id,
        );
        break;
      }
      default:
        break;
    }
  };

  private logCronJobFinished = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job finished...`);
  };

  private logCronJobStarted = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job started...`);
  };
}
