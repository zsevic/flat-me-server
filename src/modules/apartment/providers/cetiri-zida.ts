import { capitalizeWords, separateWords } from 'common/utils';
import { BaseProvider } from './base-provider';

export class CetiriZidaProvider extends BaseProvider {
  private readonly url = 'https://api.4zida.rs/v6/search/apartments';

  static getResults = results => results.data.ads;

  makeRequest(filters) {
    const structures = {
      '1.0': 102,
      1.5: 103,
      '2.0': 104,
      2.5: 105,
    };
    const placesIds = {
      Vračar: 541,
      Zvezdara: 28266,
    };
    const rentOrSale = {
      rent: 'rent',
      sale: 'sale',
    };

    const params = {
      for: rentOrSale[filters.rentOrSale],
      priceFrom: filters.minPrice,
      priceTo: filters.maxPrice,
      page: 1,
      placeIds: Object.keys(placesIds)
        .filter(place => filters.municipalities.includes(place))
        .map(place => placesIds[place]),
      ...(filters.rentOrSale === 'sale' && { registered: 1 }),
      structures: Object.keys(structures)
        .filter(structure => filters.structures.includes(structure))
        .map(structure => structures[structure]),
    };

    return {
      url: this.url,
      params,
    };
  }

  parseApartmentInfo = apartmentInfo => ({
    ...this.parseCommonApartmentInfo(apartmentInfo),
    id: apartmentInfo.id,
    ...(apartmentInfo.address && {
      address: capitalizeWords(apartmentInfo.address),
    }),
    createdAt: apartmentInfo.createdAt,
    description: apartmentInfo.description100,
    ...(apartmentInfo.heatingType && {
      heatingType: separateWords(apartmentInfo.heatingType),
    }),
    place: apartmentInfo?.placeNames?.[0],
    size: apartmentInfo.m2,
    structure: apartmentInfo.roomCount,
    url: `https://4zida.rs${apartmentInfo.urlPath}`,
  });
}
