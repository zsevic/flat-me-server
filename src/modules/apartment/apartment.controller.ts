import { Controller, Get, Query } from '@nestjs/common';
import { PaginatedResponse } from 'modules/pagination/pagination.interfaces';
import { ApartmentDocument } from './apartment.schema';
import { ApartmentService } from './apartment.service';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';

@Controller('apartments')
export class ApartmentController {
  constructor(private readonly apartmentService: ApartmentService) {}

  @Get()
  async getApartmentList(
    @Query() apartmentListParamsDto: ApartmentListParamsDto,
  ): Promise<PaginatedResponse<ApartmentDocument>> {
    return this.apartmentService.getApartmentListFromDatabase(
      apartmentListParamsDto,
    );
  }
}
