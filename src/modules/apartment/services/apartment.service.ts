import { Injectable } from '@nestjs/common';
import { FiltersDto } from 'modules/filter/dto/filters.dto';
import {
  BaseProvider,
  CetiriZidaProvider,
  CityExpertProvider,
} from '../providers';

@Injectable()
export class ApartmentService {
  private readonly providers = {
    cetiriZida: CetiriZidaProvider,
    cityExpert: CityExpertProvider,
  };

  async findApartments(providerRequests, filters: FiltersDto, foundApartments) {
    const newRequests = [];
    const filtersWithNextPage = {
      ...filters,
      pageNumber: filters.pageNumber + 1,
    };

    const providerResults = await Promise.all(
      providerRequests.map(providerRequest => providerRequest.request),
    );
    providerResults.forEach((providerResult: any, index) => {
      const { providerName } = providerRequests[index];

      const apartments = this.providers[providerName].getResults(
        providerResult,
      );
      apartments.forEach(apartment => {
        if (!apartment.price) return;

        const apartmentInfo = new this.providers[
          providerName
        ]().parseApartmentInfo(apartment);
        foundApartments.push(apartmentInfo);
      });
      const hasNextPage = this.providers[providerName].hasNextPage(
        providerResult,
        filters.pageNumber,
      );
      if (hasNextPage) {
        newRequests.push(
          new BaseProvider().getProviderRequest(
            providerName,
            this.providers[providerName],
            {
              ...filters,
              pageNumber: filters.pageNumber + 1,
            },
          ),
        );
      }
    });

    return newRequests.length > 0
      ? this.findApartments(newRequests, filtersWithNextPage, foundApartments)
      : foundApartments;
  }

  async getApartmentList(filters: FiltersDto) {
    try {
      const providerRequests = new BaseProvider().getProviderRequests(
        this.providers,
        filters,
      );

      return this.findApartments(providerRequests, filters, []);
    } catch (error) {
      console.error(error);
    }
  }
}
