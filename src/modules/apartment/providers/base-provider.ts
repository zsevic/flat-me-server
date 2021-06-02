import axios from 'axios';
import { FURNISHED } from '../apartment.constants';

export class BaseProvider {
  static getProviderRequests = (providers: any, filters: any) => {
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
