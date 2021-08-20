import axios from 'axios';
import { FilterDto } from 'modules/filter/dto/filter.dto';

export class BaseProvider {
  getProviderRequests = (providers: any, filter: FilterDto) =>
    Object.entries(providers).map(([providerName, provider]: [string, any]) =>
      this.getProviderRequest(providerName, provider, filter),
    );

  getProviderRequest = (providerName, provider, filter: FilterDto) => ({
    request: axios(new provider().makeRequest(filter)),
    providerName,
  });

  getProviderResults = async (providerRequests): Promise<any[]> =>
    Promise.all(
      providerRequests.map(providerRequest => providerRequest.request),
    );

  parseCommonApartmentInfo = apartmentInfo => ({
    price: apartmentInfo.price,
  });
}
