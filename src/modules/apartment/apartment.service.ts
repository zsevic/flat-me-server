import { Injectable } from '@nestjs/common';
import { ApartmentQueryDto } from './dto/apartment-query.dto';
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

  async getApartmentList(query: ApartmentQueryDto) {
    try {
      const providerRequests = BaseProvider.getProviderRequests(
        this.providers,
        query,
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
