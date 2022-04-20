import { Controller, Get, Param, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CursorPaginatedResponse } from 'modules/pagination/pagination.interfaces';
import { Apartment, ApartmentStatus } from './apartment.interface';
import { ApartmentService } from './apartment.service';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import { ApartmentStatusDto } from './dto/apartment-status.dto';
import { FoundApartmentListParamsDto } from './dto/found-apartment-list-params.dto';

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

  @SkipThrottle()
  @Get('found')
  async getFoundApartmentList(
    @Query() foundApartmentListParamsDto: FoundApartmentListParamsDto,
  ): Promise<CursorPaginatedResponse<Apartment>> {
    return this.apartmentService.getFoundApartmentList(
      foundApartmentListParamsDto.token,
    );
  }

  @SkipThrottle()
  @Get(':id')
  async validateApartment(
    @Param() params: ApartmentStatusDto,
  ): Promise<ApartmentStatus> {
    return this.apartmentService.validateApartment(params.id);
  }
}
