import { HttpService, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { FilterDocument } from 'modules/filter/filter.schema';
import { UserService } from 'modules/user/user.service';
import {
  apartmentActivityBaseUrlForCetiriZida,
  apartmentActivityBaseUrlForCityExpert,
  apartmentStatusFinished,
  apartmentStatusNotAvailable,
} from './apartment.constants';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import { BaseProvider } from './providers';

@Injectable()
export class ApartmentService {
  private readonly logger = new Logger(ApartmentService.name);

  constructor(
    private readonly apartmentRepository: ApartmentRepository,
    private readonly baseProvider: BaseProvider,
    private readonly httpService: HttpService,
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
        const { providerName } = providerRequests[index];

        const provider = this.baseProvider.createProvider(providerName);
        const apartments = provider.getResults(providerResult) || [];
        if (apartments.length === 0) continue;

        apartments.forEach(apartment => {
          if (!apartment.price) return;

          const apartmentInfo = provider.parseApartmentInfo(apartment);
          if (!apartmentInfo.coverPhotoUrl || !apartmentInfo.floor) return;

          foundApartments.push(apartmentInfo);
        });

        this.logger.log(
          `Found ${foundApartments.length} new apartment(s) from ${providerName} for ${filter.rentOrSale}, page ${filter.pageNumber}`,
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
            this.baseProvider.getProviderRequest(providerName, provider, {
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
    filter: FilterDocument,
    limitPerPage: number,
  ) {
    const apartmentListParams = {
      ...filter,
      limitPerPage,
      pageNumber: 1,
    };
    const receivedApartmentsIds = await this.userService.getReceivedApartmentsIds(
      filter.user,
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
  ) {
    return this.apartmentRepository.getApartmentList(
      filter,
      skippedApartmentments,
      dateFilter,
    );
  }

  async getApartmentsIds(): Promise<string[]> {
    return this.apartmentRepository.getApartmentsIds();
  }

  async handleDeletingInactiveApartmentFromCetiriZida(
    id: string,
  ): Promise<void> {
    const [providerName, apartmentId] = id.split('_');
    try {
      await this.httpService
        .get(`${apartmentActivityBaseUrlForCetiriZida}/${apartmentId}`)
        .toPromise();
    } catch (error) {
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        this.logger.log(`Deleting apartment: ${id} for ${providerName}`);
        return this.deleteApartment(id);
      }
      this.logger.error(error);
    }
  }

  async handleDeletingInactiveApartmentFromCityExpert(
    id: string,
  ): Promise<void> {
    const [providerName, apartmentId] = id.split('_');
    try {
      const [propertyId] = apartmentId.split('-');
      const response = await this.httpService
        .get(`${apartmentActivityBaseUrlForCityExpert}/${propertyId}/r`)
        .toPromise();
      if (
        [apartmentStatusFinished, apartmentStatusNotAvailable].includes(
          response.data.status,
        )
      ) {
        this.logger.log(
          `Deleting apartment: ${id} for provider ${providerName}, status: ${response.data.status}`,
        );
        await this.deleteApartment(id);
      }
    } catch (error) {
      if (error.response.status === HttpStatus.NOT_FOUND) {
        this.logger.log(
          `Deleting apartment: ${id} for ${providerName}, status: NOT_FOUND`,
        );
        return this.deleteApartment(id);
      }
      this.logger.error(error);
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
