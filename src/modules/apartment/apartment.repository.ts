import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
  Between,
  EntityRepository,
  In,
  IsNull,
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
  CursorPaginatedResponse,
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import {
  fromCursorHash,
  getSkip,
  toCursorHash,
} from 'modules/pagination/pagination.utils';
import { Subscription } from 'modules/user/subscription.enum';
import { ApartmentEntity } from './apartment.entity';
import { Apartment } from './apartment.interface';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import { FoundApartmentListParamsDto } from './dto/found-apartment-list-params.dto';

@Injectable()
@EntityRepository(ApartmentEntity)
export class ApartmentRepository extends Repository<ApartmentEntity> {
  private createQueryForApartmentList = (
    filter: ApartmentListParamsDto,
    skippedApartments?: string[],
    dateFilter?: Date,
    withCurrentPrice?: boolean,
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
      advertiserType:
        filter.advertiserTypes?.length > 0
          ? In(filter.advertiserTypes)
          : In(ADVERTISER_TYPES),
      ...(dateFilter && {
        createdAt: MoreThan(dateFilter),
      }),
      ...(withCurrentPrice && { currentPrice: Not(IsNull()) }),
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

  private getCursorPaginatedData(
    apartments: ApartmentEntity[],
    limitPerPage: number,
  ) {
    const hasNextPage = apartments.length > limitPerPage;
    const data = hasNextPage ? apartments.slice(0, -1) : apartments;

    const endCursor =
      hasNextPage && toCursorHash(data[data.length - 1].postedAt.toString());

    return {
      data: plainToClass(Apartment, data),
      pageInfo: {
        hasNextPage,
        endCursor,
      },
    };
  }

  async getCursorPaginatedApartmentList(
    filter: ApartmentListParamsDto,
    withCurrentPrice?: boolean,
  ): Promise<CursorPaginatedResponse<Apartment>> {
    const query = this.createQueryForApartmentList(filter, undefined, undefined, withCurrentPrice);

    const apartments = await this.find({
      where: query,
      order: {
        postedAt: 'DESC',
        createdAt: 'DESC',
      },
      take: filter.limitPerPage + 1,
    });

    return this.getCursorPaginatedData(apartments, filter.limitPerPage);
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
      data: plainToClass(Apartment, data),
      total,
    };
  }

  private generateFilterDate(): Date {
    const date = new Date();
    const filterDate = new Date(date);
    const dateHours = date.getHours();
    if (dateHours >= 0 && dateHours <= 7) {
      filterDate.setDate(date.getDate() - 1);
    }
    filterDate.setHours(8);
    filterDate.setMinutes(0);
    filterDate.setSeconds(0);
    filterDate.setMilliseconds(0);
    return filterDate;
  }

  async getFoundApartmentList(
    userId: string,
    filter: FoundApartmentListParamsDto,
    userSubscription: Subscription,
  ): Promise<CursorPaginatedResponse<Apartment>> {
    let queryBuilder = this.createQueryBuilder('apartment').innerJoin(
      'apartment.users',
      'user',
      'user.id = :userId',
      {
        userId,
      },
    );

    const filterDate = this.generateFilterDate();
    if (filter.cursor) {
      queryBuilder = queryBuilder.where('apartment.postedAt < :date', {
        date: new Date(fromCursorHash(filter.cursor)),
      });
    }
    if (filter.cursor && userSubscription === Subscription.FREE) {
      queryBuilder = queryBuilder.andWhere('apartment.createdAt < :createdAt', {
        createdAt: filterDate,
      });
    }
    if (!filter.cursor && userSubscription === Subscription.FREE) {
      queryBuilder = queryBuilder.where('apartment.createdAt < :createdAt', {
        createdAt: filterDate,
      });
    }

    const apartments = await queryBuilder
      .orderBy('apartment.createdAt', 'DESC')
      .take(filter.limitPerPage + 1)
      .getMany();

    return this.getCursorPaginatedData(apartments, filter.limitPerPage);
  }

  async saveApartmentList(apartments: Apartment[]): Promise<void> {
    await this.save(apartments);
  }

  async updateCurrentPrice(id: string, price: number): Promise<void> {
    await this.update(
      { id },
      {
        currentPrice: price,
      },
    );
  }

  async updateLastCheckedDatetime(apartmentId: string): Promise<void> {
    const apartment = await this.findOne({ id: apartmentId });
    if (!apartment) {
      throw new Error(`Apartment ${apartmentId} is not found`);
    }

    await this.save({
      ...apartment,
      lastCheckedAt: new Date(),
    });
  }
}
