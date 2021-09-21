import { AxiosRequestConfig } from 'axios';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Apartment } from '../apartment.interface';

export interface Provider {
  createRequest(filter: FilterDto);
  createRequestConfig(filter: FilterDto): AxiosRequestConfig;
  createRequestForApartment?(apartmentId: string);
  createRequestConfigForApartment?(apartmentId: string): AxiosRequestConfig;
  getApartmentUrl?(apartmentId: string): string;
  getResults(data);
  hasNextPage(data, pageNumber?: number): boolean;
  parseApartmentInfo(apartmentInfo): Apartment;
  updateInfoFromApartment?(apartmentData, apartmentInfo: Apartment): Apartment;
  isApartmentInactive(id: string): Promise<boolean>;
}
