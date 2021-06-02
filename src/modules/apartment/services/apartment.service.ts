import { Injectable } from '@nestjs/common';
import { FiltersDto } from '../dto/filters.dto';
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

  async getApartmentList(filters: FiltersDto) {
    try {
      const providerRequests = BaseProvider.getProviderRequests(
        this.providers,
        filters,
      );
      const providerResults = await Promise.all(
        providerRequests.map(providerRequest => providerRequest.request),
      );

      const foundApartments = [];
      providerResults.forEach((providerResult, index) => {
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
      });

      return foundApartments;
    } catch (error) {
      console.error(error);
    }
  }
}
