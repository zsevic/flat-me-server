import { FiltersDto } from 'modules/filter/dto/filters.dto';

export interface Provider {
  makeRequest(filters: FiltersDto);
  parseApartmentInfo(apartmentInfo);
}
