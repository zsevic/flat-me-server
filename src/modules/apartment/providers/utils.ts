import axios, { AxiosRequestConfig } from 'axios';
import { DEFAULT_TIMEOUT } from 'common/constants';
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

export function createRequestForApartment(apartmentId: string, url?: string) {
  return {
    request: axios(this.createRequestConfigForApartment(apartmentId, url))
      .then(response => response.data)
      .catch(error => {
        this.logger.error(
          `Request failed for apartment ${this.providerName}_${apartmentId}`,
          error,
        );
        return null;
      }),
    provider: this as Provider,
  };
}

export function createRequestConfigForApartment(
  apartmentId: string,
  url?: string,
): AxiosRequestConfig {
  return {
    url: url || this.getApartmentUrl(apartmentId),
    method: 'GET',
    timeout: DEFAULT_TIMEOUT,
  };
}

export function parseFloor(floorData, atticKey, totalFloors?: number) {
  if (Number(floorData) === Number(totalFloors)) {
    return this.floor[atticKey];
  }

  return this.floor[floorData] || floorData;
}
