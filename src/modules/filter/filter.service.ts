import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getUniqueValuesQuery } from 'common/utils';
import { Model, Types } from 'mongoose';
import { FilterDto } from './dto/filter.dto';
import { Filter, FilterDocument } from './filter.schema';

@Injectable()
export class FilterService {
  constructor(
    @InjectModel(Filter.name) private filterModel: Model<FilterDocument>,
  ) {}

  async getFilterListForSubscription(subscriptionName: string) {
    return this.filterModel.aggregate([
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
          'usersData.isVerified': true,
          'usersData.subscription': subscriptionName,
        },
      },
      {
        $project: {
          _id: 0,
          minPrice: 1,
          maxPrice: 1,
          municipalities: 1,
          rentOrSale: 1,
          structures: 1,
          user: 1,
        },
      },
    ]);
  }

  async getUniqueFilter() {
    return this.filterModel.aggregate([
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
          'usersData.isVerified': true,
        },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$minPrice' },
          maxPrice: { $max: '$maxPrice' },
          uniqueMunicipalities: { $addToSet: '$municipalities' },
          rentOrSale: { $addToSet: '$rentOrSale' },
          uniqueStructures: { $addToSet: '$structures' },
        },
      },
      {
        $project: {
          _id: 0,
          minPrice: 1,
          maxPrice: 1,
          municipalities: getUniqueValuesQuery('$uniqueMunicipalities'),
          rentOrSale: 1,
          structures: getUniqueValuesQuery('$uniqueStructures'),
        },
      },
    ]);
  }

  static getInitialFilter = (filter: FilterDto): FilterDto => ({
    ...filter,
    ...(Array.isArray(filter.rentOrSale) && {
      rentOrSale: filter.rentOrSale[0],
    }),
    pageNumber: 1,
  });

  async populateUser(filter) {
    return this.filterModel.populate(filter, { path: 'user' });
  }

  async saveFilter(filter: Filter): Promise<Filter> {
    const createdFilter = new this.filterModel({
      _id: Types.ObjectId(),
      ...filter,
    });

    return createdFilter.save();
  }

  async verifyFilter(id: string): Promise<Filter> {
    const filter = await this.filterModel.findOne({
      _id: id,
      isVerified: false,
    });
    if (!filter) throw new BadRequestException('Filter verification failed');

    filter.set({
      isVerified: true,
    });
    await filter.save();

    return filter;
  }
}
