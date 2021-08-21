import { Injectable } from '@nestjs/common';
import { TokenService } from 'modules/token/token.service';
import { FilterDto } from './dto/filter.dto';
import { FilterRepository } from './filter.repository';
import { Filter, FilterDocument } from './filter.schema';

@Injectable()
export class FilterService {
  constructor(
    private readonly filterRepository: FilterRepository,
    private readonly tokenService: TokenService,
  ) {}

  async deactivateFilter(filterId: string): Promise<void> {
    const filter = await this.filterRepository.findFilterById(filterId);

    return this.filterRepository.deactivateFilter(filter);
  }

  async getDeactivationUrl(
    filterId: string,
    expirationHours: number,
  ): Promise<string> {
    const deactivationToken = await this.tokenService.createAndSaveToken(
      { filter: filterId },
      expirationHours,
    );

    return `${process.env.CLIENT_URL}/filters/deactivation/${deactivationToken}`;
  }

  async getFilterListBySubscriptionName(
    subscriptionName: string,
  ): Promise<FilterDocument[]> {
    return this.filterRepository.getFilterListBySubscriptionName(
      subscriptionName,
    );
  }

  getInitialFilter = (filter: FilterDto): FilterDto => ({
    ...filter,
    pageNumber: 1,
  });

  async saveFilter(filter: Filter): Promise<Filter> {
    return this.filterRepository.saveFilter(filter);
  }

  async verifyAndActivateFilter(id: string): Promise<Filter> {
    const filter = await this.filterRepository.findUnverifiedFilter(id);

    await this.filterRepository.verifyAndActivateFilter(filter);

    return filter;
  }
}
