import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private readonly apartmentRepository: ApartmentRepository) {}

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
  ) {
    return this.apartmentRepository.getApartmentList(
      filter,
      skippedApartmentments,
    );
  }

  async getApartmentsIds(): Promise<string[]> {
    return this.apartmentRepository.getApartmentsIds();
  }
}
