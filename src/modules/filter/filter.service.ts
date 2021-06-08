import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SaveFiltersDto } from './dto/save-filters.dto';
import { Filters, FiltersDocument } from './filter.schema';

@Injectable()
export class FilterService {
  constructor(
    @InjectModel(Filters.name) private filtersModel: Model<FiltersDocument>,
  ) {}

  async saveFilters(filters: SaveFiltersDto): Promise<Filters> {
    const createdFilters = new this.filtersModel(filters);

    return createdFilters.save();
  }
}
