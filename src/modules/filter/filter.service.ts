import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getUniqueValuesQuery } from 'common/utils';
import { Model } from 'mongoose';
import { FiltersDto } from './dto/filters.dto';
import { Filter } from './filter.interface';
import { Filters, FiltersDocument } from './filter.schema';

@Injectable()
export class FilterService {
  constructor(
    @InjectModel(Filters.name) private filtersModel: Model<FiltersDocument>,
  ) {}

  async getFilterListForSubscription(subscriptionName: string) {
    return this.filtersModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'usersData',
        },
      },
      {
        $match: {
          'usersData.is_verified': true,
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
          user_id: 1,
        },
      },
    ]);
  }

  async getUniqueFilters() {
    return this.filtersModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'usersData',
        },
      },
      {
        $match: {
          'usersData.is_verified': true,
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

  static getInitialFilters = (filters: FiltersDto): FiltersDto => ({
    ...filters,
    ...(Array.isArray(filters.rentOrSale) && {
      rentOrSale: filters.rentOrSale[0],
    }),
    pageNumber: 1,
  });

  async populateUser(filter) {
    return this.filtersModel.populate(filter, { path: 'user_id' });
  }

  async saveFilters(filters: Filter): Promise<Filters> {
    const createdFilters = new this.filtersModel(filters);

    return createdFilters.save();
  }
}
