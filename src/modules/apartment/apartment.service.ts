import { HttpService, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { ApartmentRepository } from './apartment.repository';
import { ApartmentListParamsDto } from './dto/apartment-list-params.dto';
import {
  BaseProvider,
  CetiriZidaProvider,
  CityExpertProvider,
} from './providers';

@Injectable()
export class ApartmentService {
  private readonly providers = {
    cetiriZida: CetiriZidaProvider,
    cityExpert: CityExpertProvider,
  };
  private readonly logger = new Logger(ApartmentService.name);

  constructor(
    private readonly apartmentRepository: ApartmentRepository,
    private readonly httpService: HttpService,
  ) {}

  async deleteApartment(id): Promise<void> {
    return this.apartmentRepository.deleteApartment(id);
  }

  async findApartments(providerRequests, filter: FilterDto) {
    const newRequests = [];

    const providerResults = await Promise.all(
      providerRequests.map(providerRequest => providerRequest.request),
    );
    for (const [index, providerResult] of providerResults.entries()) {
      const foundApartments = [];
      const { providerName } = providerRequests[index];

      const apartments = this.providers[providerName].getResults(
        providerResult,
      );
      apartments.forEach(apartment => {
        if (!apartment.price) return;

        const apartmentInfo = new this.providers[
          providerName
        ]().parseApartmentInfo(apartment, filter);
        if (!apartmentInfo.coverPhotoUrl || !apartmentInfo.floor) return;

        foundApartments.push(apartmentInfo);
      });

      this.logger.log(
        `Found ${foundApartments.length} new apartment(s) from ${providerName} for ${filter.rentOrSale}, page ${filter.pageNumber}`,
      );
      try {
        await this.apartmentRepository.saveApartmentList(foundApartments);
      } catch (error) {
        this.logger.error(
          `Couldn't save apartments, error: ${JSON.stringify(error)}`,
        );
        continue;
      }

      const hasNextPage = this.providers[providerName].hasNextPage(
        providerResult,
        filter.pageNumber,
      );
      if (hasNextPage) {
        newRequests.push(
          new BaseProvider().getProviderRequest(
            providerName,
            this.providers[providerName],
            {
              ...filter,
              pageNumber: filter.pageNumber + 1,
            },
          ),
        );
      }
    }

    if (newRequests.length > 0) {
      const filterWithNextPage = {
        ...filter,
        pageNumber: filter.pageNumber + 1,
      };
      return this.findApartments(newRequests, filterWithNextPage);
    }
  }

  async getApartmentListFromProviders(filter: FilterDto) {
    try {
      const providerRequests = new BaseProvider().getProviderRequests(
        this.providers,
        filter,
      );

      return this.findApartments(providerRequests, filter);
    } catch (error) {
      console.error(error);
    }
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
        .get(`https://api.4zida.rs/v5/eds/${apartmentId}`)
        .toPromise();
    } catch (error) {
      if (error.response.status === HttpStatus.NOT_FOUND) {
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
        .get(`https://cityexpert.rs/api/PropertyView/${propertyId}/r`)
        .toPromise();
      if (['FINISHED', 'NOT-AVAILABLE'].includes(response.data.status)) {
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
}
