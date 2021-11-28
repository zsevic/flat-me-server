import { Logger } from '@nestjs/common';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { CetiriZidaProvider } from './cetiri-zida';
import { CityExpertProvider } from './city-expert';
import { HaloOglasiProvider } from './halo-oglasi';
import { Provider } from './provider.interface';

export class BaseProvider {
  private readonly providers = {
    cetiriZida: CetiriZidaProvider,
    cityExpert: CityExpertProvider,
    haloOglasi: HaloOglasiProvider,
  };
  private readonly logger = new Logger(BaseProvider.name);

  createProvider(providerName: string): Provider {
    if (!Object.keys(this.providers).includes(providerName)) {
      throw new Error(`Provider name (${providerName}) is not valid`);
    }

    return new this.providers[providerName]();
  }

  getProviderRequests(filter: FilterDto) {
    return Object.keys(this.providers)
      .map((providerName: string) => {
        const provider = this.createProvider(providerName);
        return provider.createRequest(filter);
      })
      .filter(request => !!request);
  }

  getProviderResults = async (providerRequests): Promise<any[]> =>
    Promise.all(
      providerRequests.map(providerRequest => providerRequest.request),
    );
}
