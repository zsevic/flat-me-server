import { FilterDto } from 'modules/filter/dto/filter.dto';

export interface Provider {
  makeRequest(filter: FilterDto);
  parseApartmentInfo(apartmentInfo);
}
