import { Controller, Get, Query } from '@nestjs/common';
import { ApartmentService } from './apartment.service';
import { ApartmentQueryDto } from './dto/apartment-query.dto';

@Controller('apartments')
export class ApartmentController {
  constructor(private readonly apartmentService: ApartmentService) {}

  @Get()
  async getApartmentList(@Query() query: ApartmentQueryDto) {
    return this.apartmentService.getApartmentList(query);
  }
}
