import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION } from 'modules/apartment/apartment.constants';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { ApartmentListParamsDto } from 'modules/apartment/dto/apartment-list-params.dto';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { filters } from 'modules/filter/filter.constants';
import { FilterDocument } from 'modules/filter/filter.schema';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS } from 'modules/token/token.constants';
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

    try {
      await Promise.all(
        filters.map(filter => this.sendNewApartmentsByFilter(filter)),
      );
    } catch (error) {
      this.logger.error(error);
    }

    this.logCronJobFinished(SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB);
  }

  async getApartmentListFromDatabaseByFilter(
    filter: FilterDocument,
    limitPerPage: number,
  ) {
    const apartmentListParams = {
      ...filter,
      limitPerPage,
      pageNumber: 1,
    };
    const receivedApartmentsIds = await this.userService.getReceivedApartmentsIds(
      filter.user,
    );

    return this.apartmentService.getApartmentListFromDatabase(
      apartmentListParams as ApartmentListParamsDto,
      receivedApartmentsIds,
      filter.createdAt,
    );
  }

  async sendNewApartmentsByFilter(filter: FilterDocument): Promise<void> {
    try {
      await this.tokenService.deleteTokenByFilterId(filter._id);
      this.logger.log(`Filter: ${JSON.stringify(filter)}`);

      const apartmentList = await this.getApartmentListFromDatabaseByFilter(
        filter,
        RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION,
      );
      if (apartmentList.data.length === 0) {
        this.logger.log('There are no apartments to send to the user');
        return;
      }

      const deactivationToken = await this.tokenService.createAndSaveToken(
        { filter: filter._id },
        FILTER_DEACTIVATION_TOKEN_EXPIRATION_HOURS,
      );
      const filterDeactivationUrl = this.filterService.getDeactivationUrl(
        deactivationToken.value,
      );
      const newApartments = [...apartmentList.data].sort(
        (firstApartment, secondApartment) =>
          firstApartment.price - secondApartment.price,
      );
      const userEmail = await this.userService.getUserEmail(filter.user);
      await this.mailService.sendMailWithNewApartments(
        userEmail,
        newApartments,
        filter as FilterDto,
        filterDeactivationUrl,
      );

      const newApartmentsIds = newApartments.map(apartment => apartment._id);
      await this.userService.insertReceivedApartmentsIds(
        filter.user,
        newApartmentsIds,
      );
    } catch (error) {
      this.logger.error(error);
    }
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
