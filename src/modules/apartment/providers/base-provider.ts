import axios from 'axios';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { FURNISHED } from '../apartment.constants';

export class BaseProvider {
  getProviderRequests = (providers: any, filter: FilterDto) =>
    Object.entries(providers).map(([providerName, provider]: [string, any]) =>
      this.getProviderRequest(providerName, provider, filter),
    );

  getProviderRequest = (providerName, provider, filter: FilterDto) => ({
    request: axios(new provider().makeRequest(filter)),
    providerName,
  });

  parseCommonApartmentInfo = apartmentInfo => ({
    floor: apartmentInfo.floor,
    isFurnished: FURNISHED.includes(apartmentInfo.furnished),
    price: apartmentInfo.price,
  });
}
