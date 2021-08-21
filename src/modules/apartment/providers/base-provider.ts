import { Logger } from '@nestjs/common';
import axios from 'axios';
import { FilterDto } from 'modules/filter/dto/filter.dto';

export class BaseProvider {
  private readonly logger = new Logger(BaseProvider.name);

  getProviderRequests = (providers: any, filter: FilterDto) =>
    Object.entries(providers).map(([providerName, provider]: [string, any]) =>
      this.getProviderRequest(providerName, provider, filter),
    );

  getProviderRequest = (providerName, provider, filter: FilterDto) => ({
    request: axios(new provider().makeRequest(filter))
      .then(response => response.data)
      .catch(error => {
        this.logger.error(`Request failed for ${providerName}`, error);
        return {};
      }),
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
