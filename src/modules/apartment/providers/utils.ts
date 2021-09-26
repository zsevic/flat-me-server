import axios, { AxiosRequestConfig } from 'axios';
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

export function createRequestForApartment(apartmentId: string) {
  return {
    request: axios(this.createRequestConfigForApartment(apartmentId))
      .then(response => response.data)
      .catch(error => {
        this.logger.error(`Request failed for apartment ${apartmentId}`, error);
        return null;
      }),
    provider: this as Provider,
  };
}

export function createRequestConfigForApartment(
  apartmentId: string,
): AxiosRequestConfig {
  return {
    url: this.getApartmentUrl(apartmentId),
    method: 'GET',
  };
}

export function parseFloor(floorData, atticKey, totalFloors?: number) {
  if (Number(floorData) === Number(totalFloors)) {
    return this.floor[atticKey];
  }

  return this.floor[floorData] || floorData;
}
