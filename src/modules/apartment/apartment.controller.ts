import { Controller, Get, Query } from '@nestjs/common';
import { FiltersDto } from 'modules/filter/dto/filters.dto';
import { FilterService } from 'modules/filter/filter.service';
import { ApartmentService } from './services';

@Controller('apartments')
export class ApartmentController {
  constructor(private readonly apartmentService: ApartmentService) {}

  @Get()
  async getApartmentList(@Query() filters: FiltersDto) {
    return this.apartmentService.getApartmentListFromDatabase(
      FilterService.getInitialFilters(filters),
    );
  }
}
