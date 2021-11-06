import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Filter } from 'modules/filter/filter.interface';
import { defaultPaginationParams } from 'modules/pagination/pagination.constants';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { getSkip } from 'modules/pagination/pagination.utils';
import { requiredFields } from './apartment.constants';
import { Apartment } from './apartment.interface';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import { BaseProvider } from './providers';
import { Provider } from './providers/provider.interface';

@Injectable()
export class ApartmentService {
  private readonly logger = new Logger(ApartmentService.name);

  constructor(
    @InjectRepository(ApartmentRepository)
    private readonly apartmentRepository: ApartmentRepository,
    private readonly baseProvider: BaseProvider,
  ) {}

  async deleteApartment(id): Promise<void> {
    return this.apartmentRepository.deleteApartment(id);
  }

  private async findAndSaveApartmentsFromProviders(
    providerRequests,
    filter: FilterDto,
  ) {
    const newRequests = [];

    try {
      const providerResults = await this.baseProvider.getProviderResults(
        providerRequests,
      );
      for (const [index, providerResult] of providerResults.entries()) {
        const { provider } = providerRequests[index];

        const apartments = provider.getResults(providerResult) || [];
        if (apartments.length === 0) continue;

        const foundApartments = await this.getFoundApartments(
          apartments,
          provider,
        );
        if (foundApartments.length === 0) {
          this.logger.log(
            `Skipping saving for provider ${provider.providerName}, there are no found apartments`,
          );
          continue;
        }

        try {
          this.logger.log(
            `Saving ${foundApartments.length} new apartment(s) from ${provider.providerName} for ${filter.rentOrSale}, page ${filter.pageNumber}`,
          );
          await this.apartmentRepository.saveApartmentList(foundApartments);
        } catch (error) {
          this.logger.error(error.message);
          continue;
        }

        const hasNextPage = provider.hasNextPage(
          providerResult,
          filter.pageNumber,
        );
        if (hasNextPage) {
          newRequests.push(
            provider.createRequest({
              ...filter,
              pageNumber: filter.pageNumber + 1,
            }),
          );
        }
      }

      if (newRequests.length > 0) {
        const filterWithNextPage = {
          ...filter,
          pageNumber: filter.pageNumber + 1,
        };
        return this.findAndSaveApartmentsFromProviders(
          newRequests,
          filterWithNextPage,
        );
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getApartmentListFromDatabaseByFilter(
    filter: Filter,
    limitPerPage: number,
  ) {
    const apartmentListParams = {
      ...filter,
      limitPerPage,
      pageNumber: 1,
    };
    const apartmentsIds = filter.user.apartments.map(apartment => apartment.id);

    return this.getApartmentListFromDatabase(
      apartmentListParams as ApartmentListParamsDto,
      apartmentsIds,
      filter.createdAt,
    );
  }

  async getApartmentListFromDatabase(
    filter: ApartmentListParamsDto,
    skippedApartmentments?: string[],
    dateFilter?: Date,
  ): Promise<PaginatedResponse<Apartment>> {
    return this.apartmentRepository.getApartmentList(
      filter,
      skippedApartmentments,
      dateFilter,
    );
  }

  async getApartmentsIds(
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<string>> {
    return this.apartmentRepository.getApartmentsIds(paginationParams);
  }

  getFoundApartments = async (
    apartments,
    provider: Provider,
  ): Promise<Apartment[]> => {
    const foundAparments = [];
    for (const apartment of apartments) {
      if (!apartment.price) continue;

      const apartmentInfo = provider.parseApartmentInfo(apartment);
      const isValidApartmentInfo = requiredFields.every(
        field => !!apartmentInfo[field],
      );
      if (!isValidApartmentInfo) continue;

      const isApartmentAlreadySaved = await this.apartmentRepository.findOne({
        id: apartmentInfo.id,
      });
      if (isApartmentAlreadySaved) {
        continue;
      }

      try {
        const apartmentData = await provider.createRequestForApartment(
          apartmentInfo.apartmentId,
        ).request;
        if (!apartmentData) continue;
        provider.updateInfoFromApartment(apartmentData, apartmentInfo);
      } catch (error) {
        this.logger.error(error);
      }

      foundAparments.push(apartmentInfo);
    }
    return foundAparments;
  };

  async handleDeletingInactiveApartment(
    apartmentId: string,
    lastCheckedAt: Date,
  ): Promise<void> {
    try {
      console.log('is checkable', this.isCheckableApartment(lastCheckedAt));
      if (!this.isCheckableApartment(lastCheckedAt)) return;

      const isApartmentInactive = await this.isApartmentInactive(apartmentId);
      if (!isApartmentInactive) {
        await this.apartmentRepository.updateLastCheckedDatetime(apartmentId);
        return;
      }

      this.logger.log(`Deleting apartment: ${apartmentId}`);
      return this.deleteApartment(apartmentId);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async isApartmentInactive(id: string): Promise<boolean> {
    try {
      const [providerName] = id.split('_');
      const provider = this.baseProvider.createProvider(providerName);
      return provider.isApartmentInactive(id);
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  isCheckableApartment(lastCheckedAt: Date): boolean {
    const FIVE_MINUTES = 300000;
    if (new Date().getTime() - lastCheckedAt.getTime() > FIVE_MINUTES) {
      return true;
    }

    return false;
  }

  async saveApartmentListFromProviders(filter: FilterDto) {
    try {
      const providerRequests = this.baseProvider.getProviderRequests(filter);

      return this.findAndSaveApartmentsFromProviders(providerRequests, filter);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async validateApartmentListFromDatabase(
    filter: ApartmentListParamsDto,
  ): Promise<void> {
    const where = this.apartmentRepository.createQueryForApartmentList(filter);

    try {
      const limitPerPage = defaultPaginationParams.limitPerPage;
      let pageNumber = defaultPaginationParams.pageNumber;
      let apartmentList;
      let total;

      do {
        [apartmentList, total] = await this.apartmentRepository.findAndCount({
          where,
          take: limitPerPage,
          skip: getSkip({ limitPerPage, pageNumber }),
        });
        await Promise.all(
          apartmentList.map(apartment =>
            this.handleDeletingInactiveApartment(
              apartment.id,
              new Date(apartment.lastCheckedAt),
            ),
          ),
        );
        pageNumber++;
      } while (total >= getSkip({ limitPerPage, pageNumber }));
    } catch (error) {
      this.logger.error(error);
    }
  }
}
