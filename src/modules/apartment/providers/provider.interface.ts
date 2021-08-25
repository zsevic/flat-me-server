import { FilterDto } from 'modules/filter/dto/filter.dto';

export interface Provider {
  getResults(data);
  hasNextPage(data, pageNumber?: number): boolean;
  makeRequest(filter: FilterDto);
  parseApartmentInfo(apartmentInfo);
}
