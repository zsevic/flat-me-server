import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getUniqueValuesQuery } from 'common/utils';
import { Model } from 'mongoose';
import { Filter } from './filter.interface';
import { Filters, FiltersDocument } from './filter.schema';

@Injectable()
export class FilterService {
  constructor(
    @InjectModel(Filters.name) private filtersModel: Model<FiltersDocument>,
  ) {}

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

  async saveFilters(filters: Filter): Promise<Filters> {
    const createdFilters = new this.filtersModel(filters);

    return createdFilters.save();
  }
}