import { capitalizeWords } from 'common/utils';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { BaseProvider } from './base-provider';
import { Provider } from './provider.interface';

export class CityExpertProvider extends BaseProvider implements Provider {
  private readonly url = 'https://cityexpert.rs/api/Search/';

  static getResults = results => results.data.result;

  static hasNextPage = results => results.data.info.hasNextPage;

  makeRequest(filter: FilterDto) {
    const rentOrSale = {
      rent: 'r',
      sale: 's',
    };
    const furnished = {
      furnished: 1,
      'semi-furnished': 2,
      empty: 3,
    };
    const furnishedFilter = filter.furnished.map(
      (filter: string): number => furnished[filter],
    );

    const requestBody = {
      ptId: [],
      cityId: 1,
      rentOrSale: rentOrSale[filter.rentOrSale],
      currentPage: filter.pageNumber,
      resultsPerPage: 60,
      floor: [],
      avFrom: false,
      underConstruction: false,
      furnished: furnishedFilter,
      furnishingArray: [],
      heatingArray: [],
      parkingArray: [],
      petsArray: [],
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      minSize: null,
      maxSize: null,
      polygonsArray: filter.municipalities,
      searchSource: 'regular',
      sort: 'datedsc',
      structure: filter.structures,
      propIds: [],
      filed: filter.rentOrSale === 'sale' ? [2] : [],
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

  parseApartmentInfo = apartmentInfo => {
    const [latitude, longitude] = apartmentInfo.location.split(', ');
    const furnished = {
      1: 'furnished',
      2: 'semi-furnished',
      3: 'empty',
    };
    const heatingTypes = {
      1: 'district',
      4: 'electricity',
      99: 'central',
    };
    const rentOrSale = {
      r: 'izdavanje',
      s: 'prodaja',
    };
    const rentOrSaleField = {
      r: 'rent',
      s: 'sale',
    };
    const structures = {
      '0.5': 'garsonjera',
      '1.0': 'jednosoban',
      1.5: 'jednoiposoban',
      '2.0': 'dvosoban',
      2.5: 'dvoiposoban',
      '3.0': 'trosoban',
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
      furnished: furnished[apartmentInfo.furnished],
      ...(heatingType && { heatingType }),
      location: {
        latitude,
        longitude,
      },
      municipality: apartmentInfo.municipality,
      place: apartmentInfo?.polygons?.[0],
      rentOrSale: rentOrSaleField[apartmentInfo.rentOrSale],
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
