import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Filter } from 'modules/filter/filter.interface';
import {
  PaginatedResponse,
  PaginationParams,
} from 'modules/pagination/pagination.interfaces';
import { UserService } from 'modules/user/user.service';
import { Apartment } from './apartment.interface';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import { BaseProvider } from './providers';

@Injectable()
export class ApartmentService {
  private readonly logger = new Logger(ApartmentService.name);

  constructor(
    @InjectRepository(ApartmentRepository)
    private readonly apartmentRepository: ApartmentRepository,
    private readonly baseProvider: BaseProvider,
    private readonly userService: UserService,
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
        const foundApartments = [];
        const { provider } = providerRequests[index];

        const apartments = provider.getResults(providerResult) || [];
        if (apartments.length === 0) continue;

        apartments.forEach(apartment => {
          if (!apartment.price) return;

          const apartmentInfo = provider.parseApartmentInfo(apartment);
          if (!apartmentInfo.coverPhotoUrl || !apartmentInfo.floor) return;

          foundApartments.push(apartmentInfo);
        });

        this.logger.log(
          `Found ${foundApartments.length} new apartment(s) from ${provider.providerName} for ${filter.rentOrSale}, page ${filter.pageNumber}`,
        );
        try {
          if (foundApartments.length > 0) {
            await this.apartmentRepository.saveApartmentList(foundApartments);
          }
        } catch (error) {
          this.logger.error(
            `Couldn't save apartments, error: ${JSON.stringify(error)}`,
          );
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
    const receivedApartmentsIds = await this.userService.getReceivedApartmentsIds(
      filter.userId,
    );

    return this.getApartmentListFromDatabase(
      apartmentListParams as ApartmentListParamsDto,
      receivedApartmentsIds,
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

  async saveApartmentListFromProviders(filter: FilterDto) {
    try {
      const providerRequests = this.baseProvider.getProviderRequests(filter);

      return this.findAndSaveApartmentsFromProviders(providerRequests, filter);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
