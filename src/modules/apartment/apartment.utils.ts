import { getLocationUrl } from 'common/utils/location';
import latinize from 'latinize';
import { Apartment } from './apartment.interface';

const floorsLocaleMap = {
  cellar: 'u podrumu',
  basement: 'u suterenu',
  'low ground floor': 'na niskom prizemlju',
  'ground floor': 'na prizemlju',
  'high ground floor': 'na visokom prizemlju',
  attic: 'u potkrovlju',
  '2-4': '2-4. sprat',
  '5-10': '5-10. sprat',
  '11+': '11+. sprat',
};

const handleFloor = floor => floorsLocaleMap[floor] || `na ${floor}. spratu`;
const furnishedMap = {
  furnished: 'namešten',
  'semi-furnished': 'polunamešten',
  empty: 'prazan',
};
const structuresMap = {
  0.5: 'garsonjera',
  1: 'jednosoban',
  1.5: 'jednoiposoban',
  2: 'dvosoban',
  2.5: 'dvoiposoban',
  3.0: 'trosoban',
};

const showMunicipality = (apartment: Apartment): boolean =>
  !apartment.place ||
  latinize(apartment.place) !== latinize(apartment.municipality);

const showPlace = (apartment: Apartment): boolean =>
  apartment.place &&
  apartment.address &&
  latinize(apartment.place) !== latinize(apartment.address);

export const localizeApartment = (apartment: Apartment) => ({
  ...apartment,
  ...(apartment.location && {
    locationUrl: getLocationUrl(apartment.location),
  }),
  floor: handleFloor(apartment.floor),
  furnished: furnishedMap[apartment.furnished],
  structure: structuresMap[apartment.structure],
  showMunicipality: showMunicipality(apartment),
  showPlace: showPlace(apartment),
  isForRent: apartment.rentOrSale === 'rent',
});
