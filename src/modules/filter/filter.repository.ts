import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { getSkip } from 'modules/pagination/pagination.utils';
import { Filter, FilterDocument } from './filter.schema';

@Injectable()
export class FilterRepository {
  constructor(
    @InjectModel(Filter.name) private filterModel: Model<FilterDocument>,
  ) {}

  async deactivateFilter(filter: FilterDocument): Promise<void> {
    filter.set({
      isActive: false,
    });

    await filter.save();
  }

  async findFilterById(id: string): Promise<FilterDocument> {
    const filter = await this.filterModel.findById(id);
    if (!filter) {
      throw new BadRequestException('Filter is not found');
    }

    return filter;
  }

  async findUnverifiedFilter(id: string): Promise<FilterDocument> {
    const filter = await this.filterModel.findOne({
      _id: id,
      isVerified: false,
    });
    if (!filter) throw new BadRequestException('Filter not found');

    return filter;
  }

  async getFilterListBySubscriptionName(
    subscriptionName: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<FilterDocument>> {
    const skip = getSkip(paginationParams);
    const [response] = await this.filterModel.aggregate([
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
    ]);

    return {
      data: response.data,
      total: response.total[0].count,
    };
  }

  async saveFilter(filter: Filter): Promise<Filter> {
    const createdFilter = new this.filterModel({
      _id: Types.ObjectId(),
      ...filter,
    });

    return createdFilter.save();
  }

  async verifyAndActivateFilter(filter: FilterDocument): Promise<void> {
    filter.set({
      isVerified: true,
      isActive: true,
    });

    await filter.save();
  }
}
