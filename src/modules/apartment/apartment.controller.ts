import { Controller, Get, Query } from '@nestjs/common';
import { ApartmentService } from './apartment.service';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';

@Controller('apartments')
export class ApartmentController {
  constructor(private readonly apartmentService: ApartmentService) {}

  @Get()
  async getApartmentList(
    @Query() apartmentListParamsDto: ApartmentListParamsDto,
  ) {
    return this.apartmentService.getApartmentListFromDatabase(
      apartmentListParamsDto,
    );
  }
}
