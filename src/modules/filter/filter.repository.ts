import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { getSkip } from 'modules/pagination/pagination.utils';
import { EntityRepository, MongoRepository } from 'typeorm';
import { FilterEntity } from './filter.entity';
import { Filter } from './filter.interface';

@Injectable()
@EntityRepository(FilterEntity)
export class FilterRepository extends MongoRepository<FilterEntity> {
  async deactivateFilter(filterId: string): Promise<void> {
    const filter = await this.findOne({ _id: filterId });
    if (!filter) {
      throw new BadRequestException('Filter is not found');
    }

    await this.save({
      ...filter,
      isActive: false,
    });
  }

  async findFilterById(id: string): Promise<Filter> {
    const filter = await this.findOne({ _id: id });
    if (!filter) {
      throw new BadRequestException('Filter is not found');
    }

    return filter;
  }

  async findUnverifiedFilter(id: string): Promise<Filter> {
    const filter = await this.findOne({
      _id: id,
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
    const [response] = await this.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'usersData',
        },
      },
      {
        $match: {
          isActive: true,
          'usersData.isVerified': true,
          'usersData.subscription': subscriptionName,
        },
      },
      {
        $project: {
          _id: 1,
          furnished: 1,
          minPrice: 1,
          maxPrice: 1,
          municipalities: 1,
          rentOrSale: 1,
          structures: 1,
          user: 1,
          createdAt: 1,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: paginationParams.limitPerPage }],
          total: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ]).toArray();

    console.log('response', response);

    return {
      data: response.data,
      total: response.total.length === 0 ? 0 : response.total[0].count,
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
