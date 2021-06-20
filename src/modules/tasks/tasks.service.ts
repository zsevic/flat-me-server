import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION } from 'modules/apartment/apartment.constants';
import { ApartmentService } from 'modules/apartment/services';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { Subscription } from 'modules/user/subscription.enum';
import { UserService } from 'modules/user/user.service';
import {
  SCRAPING_CRON_JOB,
  SENDING_UPDATES_FREE_SUBSCRIPTION_CRON_JOB,
} from './tasks.constants';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly apartmentService: ApartmentService,
    private readonly filterService: FilterService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: SCRAPING_CRON_JOB,
  })
  async handleScraping(): Promise<void> {
    this.logCronJobStarted(SCRAPING_CRON_JOB);
    const [filters] = await this.filterService.getUniqueFilters();
    this.logger.log(`Filters: ${!filters ? '{}' : JSON.stringify(filters)}`);

    if (!filters) return;

    const apartmentList = await this.apartmentService.getApartmentListFromProviders(
      FilterService.getInitialFilters(filters),
    );
    await this.apartmentService.saveApartmentList(apartmentList);
    this.logCronJobFinished(SCRAPING_CRON_JOB);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1PM, {
    name: SENDING_UPDATES_FREE_SUBSCRIPTION_CRON_JOB,
  })
  async handleFreeSubscriptionSendingUpdates(): Promise<void> {
    this.logCronJobStarted(SENDING_UPDATES_FREE_SUBSCRIPTION_CRON_JOB);
    const filters = await this.filterService.getFilterListForSubscription(
      Subscription.FREE,
    );
    if (!filters) return;

    filters.forEach(async filter => {
      this.logger.log(`Filters: ${!filters ? '{}' : JSON.stringify(filters)}`);
      const {
        receivedApartments: receivedApartmentIds,
      } = await this.userService.getReceivedApartmentIds(filter.user_id);

      const apartmentList = await this.apartmentService.getApartmentListFromDatabase(
        filter,
        // @ts-ignore
        receivedApartmentIds,
      );
      const apartmentListLength = apartmentList.data.length;
      if (apartmentListLength === 0) return;

      const newApartmentIds = apartmentList.data
        .map(apartment => apartment._id)
        .slice(0, RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION);
      // @ts-ignore
      await this.userService.insertReceivedApartmentIds(
        filter.user_id,
        newApartmentIds,
      );
      const populatedFilter = await this.filterService.populateUser(filter);
      await this.mailService.sendUpdatesMail(
        // @ts-ignore
        populatedFilter.user_id.email,
        newApartmentIds.length,
      );
    });

    this.logCronJobFinished(SENDING_UPDATES_FREE_SUBSCRIPTION_CRON_JOB);
  }

  private logCronJobFinished = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job finished...`);
  };

  private logCronJobStarted = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job started...`);
  };
}
