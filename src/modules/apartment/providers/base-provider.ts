import { Logger } from '@nestjs/common';
import axios from 'axios';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { CetiriZidaProvider } from './cetiri-zida';
import { CityExpertProvider } from './city-expert';
import { Provider } from './provider.interface';

export class BaseProvider {
  private readonly logger = new Logger(BaseProvider.name);

  private readonly providers = {
    cetiriZida: CetiriZidaProvider,
    cityExpert: CityExpertProvider,
  };

  createProvider(providerName: string): Provider {
    return new this.providers[providerName]();
  }

  getProviderRequests(filter: FilterDto) {
    return Object.keys(this.providers).map((providerName: string) => {
      const provider = this.createProvider(providerName);
      return this.getProviderRequest(providerName, provider, filter);
    });
  }

  getProviderRequest(
    providerName: string,
    provider: Provider,
    filter: FilterDto,
  ) {
    return {
      request: axios(provider.makeRequest(filter))
        .then(response => response.data)
        .catch(error => {
          this.logger.error(`Request failed for ${providerName}`, error);
          return {};
        }),
      providerName,
    };
  }

  getProviderResults = async (providerRequests): Promise<any[]> =>
    Promise.all(
      providerRequests.map(providerRequest => providerRequest.request),
    );
}
