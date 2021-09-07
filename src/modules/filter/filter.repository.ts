import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { getSkip } from 'modules/pagination/pagination.utils';
import { EntityRepository, Repository } from 'typeorm';
import { FilterEntity } from './filter.entity';
import { Filter } from './filter.interface';

@Injectable()
@EntityRepository(FilterEntity)
export class FilterRepository extends Repository<FilterEntity> {
  async deactivateFilter(filterId: string): Promise<void> {
    const filter = await this.findOne({ id: filterId });
    if (!filter) {
      throw new BadRequestException('Filter is not found');
    }

    await this.save({
      ...filter,
      isActive: false,
    });
  }

  async findFilterById(id: string): Promise<Filter> {
    const filter = await this.findOne({ id });
    if (!filter) {
      throw new BadRequestException('Filter is not found');
    }

    return filter;
  }

  async findUnverifiedFilter(id: string): Promise<Filter> {
    const filter = await this.findOne({
      id,
      isVerified: false,
    });
    if (!filter) throw new BadRequestException('Filter not found');

    return filter;
  }

  async getFilterListBySubscriptionName(
    subscriptionName: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Filter>> {
    const skip = getSkip(paginationParams);
    const [data, total] = await this.createQueryBuilder('filter')
      .leftJoinAndSelect('filter.user', 'user')
      .where('filter.is_active = :isActive', { isActive: true })
      .andWhere('user.is_verified = :isVerified', { isVerified: true })
      .andWhere('user.subscription = :subscription', {
        subscription: subscriptionName,
      })
      .select([
        'filter.id',
        'filter.furnished',
        'filter.minPrice',
        'filter.maxPrice',
        'filter.municipalities',
        'filter.rentOrSale',
        'filter.structures',
        'filter.createdAt',
        'user',
      ])
      .skip(skip)
      .take(paginationParams.limitPerPage)
      .getManyAndCount();

    return {
      data,
      total,
    };
  }

  async saveFilter(filter: Filter): Promise<Filter> {
    return this.save(filter);
  }

  async verifyAndActivateFilter(filter: Filter): Promise<void> {
    await this.save({
      ...filter,
      isVerified: true,
      isActive: true,
    });
  }
}
