import axios from 'axios';
import { FURNISHED } from '../apartment.constants';
import { FiltersDto } from '../dto/filters.dto';

export class BaseProvider {
  static getProviderRequests = (providers: any, filters: FiltersDto) => {
    return Object.entries(providers).map(
      ([providerName, provider]: [string, any]) => ({
        request: axios(new provider().makeRequest(filters)),
        providerName,
      }),
    );
  };

  parseCommonApartmentInfo = apartmentInfo => {
    return {
      floor: apartmentInfo.floor,
      isFurnished: FURNISHED.includes(apartmentInfo.furnished),
      price: apartmentInfo.price,
    };
  };
}
