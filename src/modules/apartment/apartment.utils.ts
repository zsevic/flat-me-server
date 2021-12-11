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
  1.0: 'jednosoban',
  '1.0': 'jednosoban',
  1.5: 'jednoiposoban',
  2.0: 'dvosoban',
  '2.0': 'dvosoban',
  2.5: 'dvoiposoban',
  3.0: 'trosoban',
  '3.0': 'trosoban',
  3.5: 'troiposoban',
  4.0: 'četvorosoban',
  '4.0': 'četvorosoban',
};

const showMunicipality = (apartment: Apartment): boolean =>
  !apartment.place ||
  latinize(apartment.place) !== latinize(apartment.municipality);

const showPlace = (apartment: Apartment): boolean =>
  apartment.place &&
  apartment.address &&
  latinize(apartment.place.toLowerCase()) !==
    latinize(apartment.address.toLowerCase());

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
