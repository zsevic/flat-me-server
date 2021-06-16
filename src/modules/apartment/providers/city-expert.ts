import { capitalizeWords } from 'common/utils';
import { FiltersDto } from 'modules/filter/dto/filters.dto';
import { BaseProvider } from './base-provider';
import { Provider } from './provider.interface';

export class CityExpertProvider extends BaseProvider implements Provider {
  private readonly url = 'https://cityexpert.rs/api/Search/';

  static getResults = results => results.data.result;

  static hasNextPage = results => results.data.info.hasNextPage;

  makeRequest(filters: FiltersDto) {
    const rentOrSale = {
      rent: 'r',
      sale: 's',
    };

    const requestBody = {
      ptId: [],
      cityId: 1,
      rentOrSale: rentOrSale[filters.rentOrSale],
      currentPage: filters.pageNumber,
      resultsPerPage: 60,
      floor: [],
      avFrom: false,
      underConstruction: false,
      furnished: [],
      furnishingArray: [],
      heatingArray: [],
      parkingArray: [],
      petsArray: [],
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minSize: null,
      maxSize: null,
      polygonsArray: filters.municipalities,
      searchSource: 'regular',
      sort: 'datedsc',
      structure: filters.structures,
      propIds: [],
      filed: filters.rentOrSale === 'sale' ? [2] : [],
      ceiling: [],
      bldgOptsArray: [],
      joineryArray: [],
      yearOfConstruction: [],
      otherArray: [],
      numBeds: null,
      category: null,
      maxTenants: null,
      extraCost: null,
      numFloors: null,
      numBedrooms: null,
      numToilets: null,
      numBathrooms: null,
      heating: null,
      bldgEquipment: [],
      cleaning: null,
      extraSpace: [],
      parking: null,
      parkingIncluded: null,
      parkingExtraCost: null,
      parkingZone: null,
      petsAllowed: null,
      smokingAllowed: null,
      aptEquipment: [],
      site: 'SR',
    };

    return {
      url: this.url,
      headers: {
        'content-type': 'application/json',
      },
      data: requestBody,
      method: 'POST',
    };
  }

  parseApartmentInfo = (apartmentInfo, filters: FiltersDto) => {
    const [latitude, longitude] = apartmentInfo.location.split(', ');
    const heatingTypes = {
      1: 'district',
      4: 'electricity',
      99: 'central',
    };
    const rentOrSale = {
      r: 'izdavanje',
      s: 'prodaja',
    };
    const structures = {
      '1.0': 'jednosoban',
      1.5: 'jednoiposoban',
      '2.0': 'dvosoban',
      2.5: 'dvoiposoban',
    };

    const { structure } = apartmentInfo;
    const heatingType = heatingTypes[apartmentInfo.heatingArray[0]];

    return {
      ...this.parseCommonApartmentInfo(apartmentInfo),
      id: apartmentInfo.uniqueID,
      ...(apartmentInfo.street && {
        address: capitalizeWords(apartmentInfo.street),
      }),
      availableFrom: apartmentInfo.availableFrom,
      ...(heatingType && { heatingType }),
      location: {
        latitude,
        longitude,
      },
      place: apartmentInfo?.polygons?.[0],
      rentOrSale: filters.rentOrSale[0],
      size: apartmentInfo.size,
      structure: Number(structure),
      url: `https://cityexpert.rs/${
        rentOrSale[apartmentInfo.rentOrSale]
      }/stan/${apartmentInfo.propId}/${
        structures[structure]
      }-${apartmentInfo.street
        .split(' ')
        .join('-')
        .toLowerCase()}-${apartmentInfo.municipality
        .split(' ')
        .join('-')
        .toLowerCase()}`,
    };
  };
}
