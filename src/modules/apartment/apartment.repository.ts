import { Injectable } from '@nestjs/common';
import {
  Between,
  EntityRepository,
  In,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { getSkip } from 'modules/pagination/pagination.utils';
import { ApartmentEntity } from './apartment.entity';
import { Apartment } from './apartment.interface';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import {
  DEFAULT_LIMIT_PER_PAGE,
  DEFAULT_PAGE_NUMBER,
} from 'modules/pagination/pagination.constants';

@Injectable()
@EntityRepository(ApartmentEntity)
export class ApartmentRepository extends Repository<ApartmentEntity> {
  async deleteApartment(id: string): Promise<void> {
    await this.delete({ id });
  }

  async getApartmentsIds(
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<string>> {
    const [apartmentList, total] = await this.findAndCount({
      select: ['id'],
      skip: getSkip(paginationParams),
      take: paginationParams.limitPerPage,
    });

    return { data: apartmentList.map(apartment => apartment.id), total };
  }

  async getApartmentList(
    filter: ApartmentListParamsDto,
    skippedApartments?: string[],
    dateFilter?: Date,
  ): Promise<PaginatedResponse<Apartment>> {
    const {
      limitPerPage = DEFAULT_LIMIT_PER_PAGE,
      pageNumber = DEFAULT_PAGE_NUMBER,
    } = filter;
    const query = {
      ...(skippedApartments &&
        Array.isArray(skippedApartments) &&
        skippedApartments.length > 0 && {
          id: Not(In(skippedApartments)),
        }),
      ...(dateFilter && {
        createdAt: MoreThan(dateFilter),
      }),
      furnished: In(filter.furnished),
      municipality: In(filter.municipalities),
      price: Between(filter.minPrice, filter.maxPrice),
      rentOrSale: filter.rentOrSale,
      structure: In(filter.structures),
    };

    const [data, total] = await this.findAndCount({
      where: query,
      skip: getSkip({ pageNumber, limitPerPage }),
      take: limitPerPage,
    });

    return {
      data,
      total,
    };
  }

  async saveApartmentList(apartments: Apartment[]): Promise<void> {
    await this.save(apartments);
  }
}
