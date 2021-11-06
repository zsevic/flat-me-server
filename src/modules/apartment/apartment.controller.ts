import { Controller, Get, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaginatedResponse } from 'modules/pagination/pagination.interfaces';
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
  ): Promise<PaginatedResponse<Apartment>> {
    if (apartmentListParamsDto.pageNumber === 1) {
      await this.apartmentService.validateApartmentListFromDatabase(
        apartmentListParamsDto,
      );
    }

    return this.apartmentService.getApartmentListFromDatabase(
      apartmentListParamsDto,
    );
  }
}
