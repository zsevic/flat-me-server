import { Controller, Get, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CursorPaginatedResponse } from 'modules/pagination/pagination.interfaces';
import { Apartment } from './apartment.interface';
import { ApartmentService } from './apartment.service';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';

@Controller('apartments')
export class ApartmentController {
  constructor(private readonly apartmentService: ApartmentService) {}

  @SkipThrottle()
  @Get()
  async getApartmentList(
    @Query() apartmentListParamsDto: ApartmentListParamsDto,
  ): Promise<CursorPaginatedResponse<Apartment>> {
    return this.apartmentService.getValidApartmentList(apartmentListParamsDto);
  }
}
