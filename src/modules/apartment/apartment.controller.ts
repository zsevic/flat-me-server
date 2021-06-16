import { Controller, Get, Query } from '@nestjs/common';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import { ApartmentService } from './services';

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
