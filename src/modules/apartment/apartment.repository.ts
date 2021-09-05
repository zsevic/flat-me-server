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

@Injectable()
@EntityRepository(ApartmentEntity)
export class ApartmentRepository extends Repository<ApartmentEntity> {
  async deleteApartment(id: string): Promise<void> {
    await this.delete({ _id: id });
  }

  async getApartmentList(
    filter: ApartmentListParamsDto,
    skippedApartments?: string[],
    dateFilter?: Date,
  ): Promise<PaginatedResponse<Apartment>> {
    const { limitPerPage = 10, pageNumber = 1 } = filter;
    const query = {
      ...(skippedApartments &&
        Array.isArray(skippedApartments) &&
        skippedApartments.length > 0 && {
          _id: Not(In(skippedApartments)),
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

  async getApartmentsIds(
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<string>> {
    const [apartmentList, total] = await this.findAndCount({
      select: ['_id'],
      skip: getSkip(paginationParams),
      take: paginationParams.limitPerPage,
    });

    return { data: apartmentList.map(apartment => apartment._id), total };
  }

  async saveApartmentList(apartments: Apartment[]): Promise<Apartment[]> {
    return this.save(apartments);
  }
}
