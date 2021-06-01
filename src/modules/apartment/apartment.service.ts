import { Injectable } from '@nestjs/common';
import apartmentProviders, { getProviderRequests } from './apartment-providers';
import { ApartmentQueryDto } from './dto/apartment-query.dto';

@Injectable()
export class ApartmentService {
  async getApartmentList(query: ApartmentQueryDto) {
    try {
      const providerRequests = getProviderRequests(apartmentProviders, query);
      const providerResults = await Promise.all(
        providerRequests.map(providerRequest => providerRequest.request),
      );

      const foundApartments = [];
      providerResults.forEach((providerResult, index) => {
        const { provider: providerKey } = providerRequests[index];

        const apartments = apartmentProviders[providerKey].getResults(
          providerResult,
        );
        apartments.forEach(apartment => {
          if (!apartment.price) return;

          const apartmentInfo = apartmentProviders[
            providerKey
          ].parseApartmentInfo(apartment);
          foundApartments.push(apartmentInfo);
        });
      });

      return foundApartments;
    } catch (error) {
      console.error(error);
    }
  }
}
