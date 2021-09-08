import { Body, Controller, Get } from '@nestjs/common';
import { PaginatedResponse } from 'modules/pagination/pagination.interfaces';
import { Apartment } from './apartment.interface';
import { ApartmentService } from './apartment.service';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';

@Controller('apartments')
export class ApartmentController {
  constructor(private readonly apartmentService: ApartmentService) {}

  @Get()
  async getApartmentList(
    @Body() apartmentListParamsDto: ApartmentListParamsDto,
  ): Promise<PaginatedResponse<Apartment>> {
    return this.apartmentService.getApartmentListFromDatabase(
      apartmentListParamsDto,
    );
  }
}
