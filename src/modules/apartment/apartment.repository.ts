import { Injectable } from '@nestjs/common';
import {
  Between,
  EntityRepository,
  In,
  LessThan,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import {
  ADVERTISER_TYPES,
  floorFilters,
  STRUCTURES,
} from 'modules/filter/filter.constants';
import {
  DEFAULT_LIMIT_PER_PAGE,
  DEFAULT_PAGE_NUMBER,
} from 'modules/pagination/pagination.constants';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import {
  fromCursorHash,
  getSkip,
  toCursorHash,
} from 'modules/pagination/pagination.utils';
import { ApartmentEntity } from './apartment.entity';
import { Apartment } from './apartment.interface';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';

@Injectable()
@EntityRepository(ApartmentEntity)
export class ApartmentRepository extends Repository<ApartmentEntity> {
  private createQueryForApartmentList = (
    filter: ApartmentListParamsDto,
    skippedApartments?: string[],
    dateFilter?: Date,
  ) => {
    const floor =
      filter.floor?.reduce((acc: string[], current: string): string[] => {
        acc.push(...floorFilters[current]);
        return acc;
      }, []) || null;

    return {
      ...(filter.cursor && {
        postedAt: LessThan(new Date(fromCursorHash(filter.cursor))),
      }),
      ...(skippedApartments &&
        Array.isArray(skippedApartments) &&
        skippedApartments.length > 0 && {
          id: Not(In(skippedApartments)),
        }),
      advertiserTypes:
        filter.advertiserTypes?.length > 0
          ? In(filter.advertiserTypes)
          : In(ADVERTISER_TYPES),
      ...(dateFilter && {
        createdAt: MoreThan(dateFilter),
      }),
      ...(floor && { floor: Not(In(floor)) }),
      ...(filter.rentOrSale === 'rent' && {
        furnished: In(filter.furnished),
      }),
      municipality: In(filter.municipalities),
      price: Between(filter.minPrice, filter.maxPrice),
      rentOrSale: filter.rentOrSale,
      structure:
        filter.structures.length > 0 ? In(filter.structures) : In(STRUCTURES),
    };
  };

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

  async getCursorPaginatedApartmentList(filter: ApartmentListParamsDto) {
    const query = this.createQueryForApartmentList(filter);

    const apartments = await this.find({
      where: query,
      order: {
        postedAt: 'DESC',
        createdAt: 'DESC',
      },
      take: filter.limitPerPage + 1,
    });

    const hasNextPage = apartments.length > filter.limitPerPage;
    const data = hasNextPage ? apartments.slice(0, -1) : apartments;

    const endCursor =
      hasNextPage && toCursorHash(data[data.length - 1].postedAt.toString());

    return {
      data,
      pageInfo: {
        hasNextPage,
        endCursor,
      },
    };
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

    const query = this.createQueryForApartmentList(
      filter,
      skippedApartments,
      dateFilter,
    );

    const [data, total] = await this.findAndCount({
      where: query,
      skip: getSkip({ pageNumber, limitPerPage }),
      order: {
        postedAt: 'DESC',
        createdAt: 'DESC',
      },
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

  async updateLastCheckedDatetime(apartmentId: string): Promise<void> {
    const apartment = await this.findOne({ id: apartmentId });
    if (!apartment) {
      throw new Error('Apartment is not found');
    }

    await this.save({
      ...apartment,
      lastCheckedAt: new Date(),
    });
  }
}
