import { Body, Controller, Post } from '@nestjs/common';
import { SaveFiltersDto } from './dto/save-filters.dto';
import { Filters } from './filter.schema';
import { FilterService } from './filter.service';

@Controller('filters')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  @Post()
  saveFilters(@Body() filters: SaveFiltersDto): Promise<Filters> {
    return this.filterService.saveFilters(filters);
  }
}
