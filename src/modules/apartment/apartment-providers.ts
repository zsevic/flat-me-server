import axios from 'axios';
import { capitalizeWords, separateWords } from 'common/utils';
import { FURNISHED } from './apartment.constants';

function parseCommonApartmentInfo(apartmentInfo) {
  return {
    floor: apartmentInfo.floor,
    isFurnished: FURNISHED.includes(apartmentInfo.furnished),
    price: apartmentInfo.price,
  };
}

const apartmentProviders = {
  '4zida': {
    getResults: results => results.data.ads,
    makeRequest: function(filters) {
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
    },
    parseApartmentInfo: apartmentInfo => ({
      ...parseCommonApartmentInfo(apartmentInfo),
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
    }),
    url: 'https://api.4zida.rs/v6/search/apartments',
  },
  cityExpert: {
    getResults: results => results.data.result,
    makeRequest: function(filters) {
      const rentOrSale = {
        rent: 'r',
        sale: 's',
      };

      const requestBody = {
        ptId: [],
        cityId: 1,
        rentOrSale: rentOrSale[filters.rentOrSale],
        currentPage: 1,
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
    },
    parseApartmentInfo: apartmentInfo => {
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
        ...parseCommonApartmentInfo(apartmentInfo),
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
    },
    url: 'https://cityexpert.rs/api/Search/',
  },
};

export function getProviderRequests(providers: any, filters: any) {
  return Object.entries(providers).map(
    ([providerKey, providerValue]: [string, any]) => ({
      request: axios(providerValue.makeRequest(filters)),
      provider: providerKey,
    }),
  );
}

export default apartmentProviders;
