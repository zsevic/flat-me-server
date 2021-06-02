import { Controller, Get, Query } from '@nestjs/common';
import { FiltersDto } from './dto/filters.dto';
import { ApartmentService } from './services';

@Controller('apartments')
export class ApartmentController {
  constructor(private readonly apartmentService: ApartmentService) {}

  @Get()
  async getApartmentList(@Query() filters: FiltersDto) {
    return this.apartmentService.getApartmentList(filters);
  }
}
