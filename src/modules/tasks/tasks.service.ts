import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApartmentService } from 'modules/apartment/services';
import { FilterService } from 'modules/filter/filter.service';
import { SCRAPING_CRON_JOB } from './tasks.constants';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly apartmentService: ApartmentService,
    private readonly filterService: FilterService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: SCRAPING_CRON_JOB,
  })
  async handleScraping() {
    this.logger.log('Scraping started...');
    const [filters] = await this.filterService.getUniqueFilters();
    this.logger.log(`Filters: ${!filters ? '{}' : JSON.stringify(filters)}`);

    if (!filters) return;

    const apartmentList = await this.apartmentService.getApartmentList(
      FilterService.getInitialFilters(filters),
    );
    console.log('apartment list', apartmentList);
  }
}
