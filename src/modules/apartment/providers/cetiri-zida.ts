import { capitalizeWords } from 'common/utils';
import { FilterDto } from 'modules/filter/dto/filter.dto';
import { Provider } from './provider.interface';
import { CETIRI_ZIDA_API_BASE_URL } from '../apartment.constants';

export class CetiriZidaProvider implements Provider {
  private readonly providerName = 'cetiriZida';
  private readonly url = `${CETIRI_ZIDA_API_BASE_URL}/v6/search/apartments`;

  getResults = data => data?.ads;

  hasNextPage = (data, pageNumber: number) => {
    const currentCount = data.ads.length * pageNumber;
    return currentCount > 0 && data.total > currentCount;
  };

  makeRequest(filter: FilterDto) {
    const furnished = {
      empty: 'no',
      furnished: 'yes',
      'semi-furnished': 'semi',
    };
    const furnishedFilter = filter.furnished.map(
      (filter: string): string => furnished[filter],
    );
    const structures = {
      '0.5': 101,
      1: 102,
      '1.5': 103,
      2: 104,
      '2.5': 105,
      3: 106,
    };
    const placesIds = {
      Čukarica: 28267,
      'Novi Beograd': 139,
      Palilula: 28257,
      'Savski venac': 213,
      'Stari grad': 28261,
      Voždovac: 28263,
      Vračar: 541,
      Zemun: 28265,
      Zvezdara: 28266,
    };
    const rentOrSale = {
      rent: 'rent',
      sale: 'sale',
    };

    const params = {
      for: rentOrSale[filter.rentOrSale],
      furnishedTypes: furnishedFilter,
      priceFrom: filter.minPrice,
      priceTo: filter.maxPrice,
      page: filter.pageNumber,
      placeIds: Object.keys(placesIds)
        .filter(place => filter.municipalities.includes(place))
        .map(place => placesIds[place]),
      ...(filter.rentOrSale === rentOrSale.sale && { registered: 1 }),
      structures: Object.keys(structures)
        .map(structure => Number(structure))
        .filter(structure => filter.structures.indexOf(structure) !== -1)
        .map(structure => structures[structure]),
    };

    return {
      url: this.url,
      params,
    };
  }

  private getMunicipality = apartmentInfo => {
    const municipalities = {
      Čukarica: 'Čukarica',
      'Novi Beograd': 'Novi Beograd',
      'Palilula opština': 'Palilula',
      'Savski Venac': 'Savski venac',
      'Stari Grad opština': 'Stari grad',
      'Voždovac opština': 'Voždovac',
      Vračar: 'Vračar',
      Zemun: 'Zemun',
      'Zvezdara opština': 'Zvezdara',
    };

    const municipalityKey = apartmentInfo?.placeNames.find(placeName =>
      Object.keys(municipalities).includes(placeName),
    );
    return municipalities[municipalityKey];
  };

  parseApartmentInfo = apartmentInfo => {
    const floor = {
      '-4': 'cellar',
      '-3': 'basement',
      '-2': 'low ground floor',
      '-1': 'ground floor',
      '0': 'high ground floor',
      100: 'attic',
    };

    const furnished = {
      no: 'empty',
      semi: 'semi-furnished',
      yes: 'furnished',
    };

    const heatingTypesMap = {
      central: 'central',
      district: 'district',
      electricity: 'electricity',
      gas: 'gas',
      norwegianRadiators: 'norwegian radiators',
      storageHeater: 'storage heater',
      thermalPump: 'thermal pump',
      tileStove: 'tile stove',
      underfloor: 'underfloor',
    };

    return {
      _id: `${this.providerName}_${apartmentInfo.id}`,
      apartmentId: apartmentInfo.id,
      providerName: this.providerName,
      ...(apartmentInfo.address && {
        address: capitalizeWords(apartmentInfo.address),
      }),
      coverPhotoUrl: apartmentInfo?.image?.search['380x0_fill_0_webp'],
      floor: floor[apartmentInfo.floor] || apartmentInfo.floor,
      furnished: furnished[apartmentInfo.furnished],
      ...(heatingTypesMap[apartmentInfo.heatingType] && {
        heatingTypes: [heatingTypesMap[apartmentInfo.heatingType]],
      }),
      municipality: this.getMunicipality(apartmentInfo),
      place: apartmentInfo?.placeNames?.[0],
      postedAt: apartmentInfo.createdAt,
      price: apartmentInfo.price,
      rentOrSale: apartmentInfo.for,
      size: apartmentInfo.m2,
      structure: apartmentInfo.roomCount,
      url: `https://4zida.rs${apartmentInfo.urlPath}`,
    };
  };
}
