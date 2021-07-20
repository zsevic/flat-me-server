import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION } from 'modules/apartment/apartment.constants';
import { ApartmentService } from 'modules/apartment/apartment.service';
import { FilterService } from 'modules/filter/filter.service';
import { MailService } from 'modules/mail/mail.service';
import { TokenService } from 'modules/token/token.service';
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
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: SCRAPING_CRON_JOB,
  })
  async handleScraping(): Promise<void> {
    this.logCronJobStarted(SCRAPING_CRON_JOB);
    const [filter] = await this.filterService.getUniqueFilter();
    this.logger.log(`Filter: ${!filter ? '{}' : JSON.stringify(filter)}`);

    if (!filter) {
      this.logger.log('There are no filters');
      this.logCronJobFinished(SCRAPING_CRON_JOB);
      return;
    }

    const apartmentList = await this.apartmentService.getApartmentListFromProviders(
      FilterService.getInitialFilter(filter),
    );
    if (apartmentList.length === 0) {
      this.logger.log('There are no new apartments');
      this.logCronJobFinished(SCRAPING_CRON_JOB);
      return;
    }
    this.logger.log(`Found ${apartmentList.length} new apartment(s)`);
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
    if (!filters.length) {
      this.logger.log('There are no filters');
      this.logCronJobFinished(SENDING_UPDATES_FREE_SUBSCRIPTION_CRON_JOB);
      return;
    }

    filters.forEach(async filter => {
      await this.tokenService.deactivateTokenByFilterId(filter._id);
      this.logger.log(`Filter: ${JSON.stringify(filter)}`);
      const {
        receivedApartments: receivedApartmentIds,
      } = await this.userService.getReceivedApartmentIds(filter.user);

      const apartmentList = await this.apartmentService.getApartmentListFromDatabase(
        filter,
        // @ts-ignore
        receivedApartmentIds,
      );
      const apartmentListLength = apartmentList.data.length;
      if (apartmentListLength === 0) {
        this.logCronJobFinished(SENDING_UPDATES_FREE_SUBSCRIPTION_CRON_JOB);
        return;
      }

      const newApartments = apartmentList.data
        .slice(0, RECEIVED_APARTMENTS_SIZE_FREE_SUBSCRIPTION)
        .sort(
          (firstApartment, secondApartment) =>
            firstApartment.price - secondApartment.price,
        );
      // @ts-ignore
      const newApartmentIds = newApartments.map(apartment => apartment._id);
      await this.userService.insertReceivedApartmentIds(
        filter.user,
        newApartmentIds,
      );
      const populatedFilter = await this.filterService.populateUser(filter);
      const deactivationToken = await this.tokenService.createToken(12);
      Object.assign(deactivationToken, { filter: filter._id });
      await this.tokenService.saveToken(deactivationToken);
      const deactivationUrl = `${process.env.CLIENT_URL}/filters/deactivation/${deactivationToken.value}`;
      await this.mailService.sendMailWithNewApartments(
        // @ts-ignore
        populatedFilter.user.email,
        newApartments,
        filter,
        deactivationUrl,
      );
      this.logCronJobFinished(SENDING_UPDATES_FREE_SUBSCRIPTION_CRON_JOB);
    });
  }

  private logCronJobFinished = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job finished...`);
  };

  private logCronJobStarted = (cronJobName: string): void => {
    this.logger.log(`${cronJobName} cron job started...`);
  };
}
