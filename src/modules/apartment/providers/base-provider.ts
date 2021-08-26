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
      return provider.createRequest(filter);
    });
  }

  getProviderResults = async (providerRequests): Promise<any[]> =>
    Promise.all(
      providerRequests.map(providerRequest => providerRequest.request),
    );
}
