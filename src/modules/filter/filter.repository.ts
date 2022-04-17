import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { getSkip } from 'modules/pagination/pagination.utils';
import { NotificationSubscriptionDto } from 'modules/subscription/notification-subscription.dto';
import { Subscription } from 'modules/user/subscription.enum';
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
    notificationSubscriptionDto: NotificationSubscriptionDto,
    userId: string,
  ): Promise<void> {
    const newFilter: Filter = {
      ...notificationSubscriptionDto.filter,
      furnished:
        notificationSubscriptionDto.filter.rentOrSale === 'sale'
          ? []
          : notificationSubscriptionDto.filter.furnished,
      userId,
      isActive: true,
      isVerified: true,
    };

    await this.saveFilter(newFilter);
  }

  async verifyAndActivateFilter(filter: Filter): Promise<void> {
    await this.save({
      ...filter,
      isVerified: true,
      isActive: true,
    });
  }
}
