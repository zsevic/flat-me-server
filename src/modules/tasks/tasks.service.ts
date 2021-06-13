import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ApartmentService } from 'modules/apartment/services';
import { FilterService } from 'modules/filter/filter.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly apartmentService: ApartmentService,
    private readonly filterService: FilterService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleScraping() {
    const [filters] = await this.filterService.getUniqueFilters();
    const apartmentList = await this.apartmentService.getApartmentList(filters);
    console.log('apartment list', apartmentList);
  }
}
