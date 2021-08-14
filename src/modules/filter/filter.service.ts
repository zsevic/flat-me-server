import { Injectable } from '@nestjs/common';
import { FilterDto } from './dto/filter.dto';
import { FilterRepository } from './filter.repository';
import { Filter, FilterDocument } from './filter.schema';

@Injectable()
export class FilterService {
  constructor(private readonly filterRepository: FilterRepository) {}

  async deactivateFilter(filterId: string): Promise<void> {
    const filter = await this.filterRepository.findFilterById(filterId);

    return this.filterRepository.deactivateFilter(filter);
  }

  async getFilterListBySubscriptionName(
    subscriptionName: string,
  ): Promise<FilterDocument[]> {
    return this.filterRepository.getFilterListBySubscriptionName(
      subscriptionName,
    );
  }

  static getInitialFilter(filter: FilterDto): FilterDto {
    return {
      ...filter,
      pageNumber: 1,
    };
  }

  async populateUser(filter: FilterDocument): Promise<FilterDocument> {
    return this.filterRepository.populateUser(filter);
  }

  async saveFilter(filter: Filter): Promise<Filter> {
    return this.filterRepository.saveFilter(filter);
  }

  async verifyAndActivateFilter(id: string): Promise<Filter> {
    const filter = await this.filterRepository.findUnverifiedFilter(id);

    await this.filterRepository.verifyAndActivateFilter(filter);

    return filter;
  }
}
