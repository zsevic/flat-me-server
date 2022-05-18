import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { getSkip } from 'modules/pagination/pagination.utils';
import { Subscription } from 'modules/user/subscription.enum';
import { EntityRepository, Repository } from 'typeorm';
import { FilterDto } from './dto/filter.dto';
import { FilterEntity } from './filter.entity';
import { RentOrSale } from './filter.enums';
import { Filter } from './filter.interface';

@Injectable()
@EntityRepository(FilterEntity)
export class FilterRepository extends Repository<FilterEntity> {
  createFilter = (filterDto: FilterDto, userId: string) => ({
    ...filterDto,
    furnished:
      filterDto.rentOrSale === RentOrSale.sale ? [] : filterDto.furnished,
    userId,
  });

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

  async findUnverifiedFilter(id: string): Promise<Filter> {
    const filter = await this.findOne({
      id,
      isVerified: false,
    });
    if (!filter) throw new BadRequestException('Filter not found');

    return filter;
  }

  async getFilterListBySubscriptionType(
    subscriptionType: Subscription,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Filter>> {
    const skip = getSkip(paginationParams);
    const [data, total] = await this.createQueryBuilder('filter')
      .leftJoin('filter.user', 'user', 'filter.userId = user.id')
      .leftJoinAndSelect('user.apartments', 'apartments')
      .where('filter.isActive = :isActive', { isActive: true })
      .andWhere('user.isVerified = :isVerified', { isVerified: true })
      .andWhere('user.subscription = :subscriptionType', {
        subscriptionType,
      })
      .select([
        'filter.id',
        'filter.advertiserTypes',
        'filter.furnished',
        'filter.floor',
        'filter.minPrice',
        'filter.maxPrice',
        'filter.municipalities',
        'filter.rentOrSale',
        'filter.structures',
        'filter.createdAt',
        'filter.userId',
        'user',
        'apartments',
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

  async saveFilterForNotificationSubscription(
    filterDto: FilterDto,
    userId: string,
  ): Promise<void> {
    const newFilter = this.createFilter(filterDto, userId);

    await this.saveFilter({
      ...newFilter,
      isActive: true,
      isVerified: true,
    });
  }

  async verifyAndActivateFilter(filter: Filter): Promise<void> {
    await this.save({
      ...filter,
      isVerified: true,
      isActive: true,
    });
  }
}
