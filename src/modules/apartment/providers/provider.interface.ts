import { AxiosRequestConfig } from 'axios';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Apartment } from '../apartment.interface';

export interface Provider {
  createRequest(filter: FilterDto);
  createRequestConfig(filter: FilterDto): AxiosRequestConfig;
  createRequestForApartment(apartmentId: string, url?: string);
  createRequestConfigForApartment(
    apartmentId: string,
    url?: string,
  ): AxiosRequestConfig;
  getApartmentUrl?(apartmentId: string): string;
  getResults(data, filter?: FilterDto);
  hasNextPage(data, pageNumber?: number): boolean;
  isApartmentInactive(id: string, url?: string): Promise<boolean>;
  parseApartmentInfo(apartmentInfo): Apartment;
  parseFloor(floorData: string, totalFloor?: number): string;
  supportedSearch: Record<string, boolean>;
  updateInfoFromApartment(apartmentData, apartmentInfo: Apartment): void;
}
