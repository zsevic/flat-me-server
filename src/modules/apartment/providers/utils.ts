import axios from 'axios';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Provider } from './provider.interface';

export function createRequest(filter: FilterDto) {
  return {
    request: axios(this.createRequestConfig(filter))
      .then(response => response.data)
      .catch(error => {
        this.logger.error(`Request failed for ${this.providerName}`, error);
        return {};
      }),
    provider: this as Provider,
  };
}
