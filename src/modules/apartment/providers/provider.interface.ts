import { FilterDto } from 'modules/filter/dto/filter.dto';

export interface Provider {
  createRequest(filter: FilterDto);
  createRequestConfig(filter: FilterDto);
  getResults(data);
  hasNextPage(data, pageNumber?: number): boolean;
  parseApartmentInfo(apartmentInfo);
  isApartmentInactive(id: string): Promise<boolean>;
}
