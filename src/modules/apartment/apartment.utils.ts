import { getLocationUrl } from 'common/utils/location';
import latinize from 'latinize';
import { Apartment } from './apartment.interface';

const floorsLocaleMap = {
  cellar: 'u podrumu',
  'semi-basement': 'u polusuterenu',
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
  3: 'trosoban',
  3.5: 'troiposoban',
  4: 'četvorosoban',
};

const isMunicipalityIncluded = (apartment: Apartment): boolean =>
  !apartment.place ||
  latinize(apartment.place) !== latinize(apartment.municipality);

const isPlaceIncluded = (apartment: Apartment): boolean => {
  const apartmentAddressLatinized = latinize(apartment.address.toLowerCase());
  const apartmentPlaceLatinized = latinize(apartment.place.toLowerCase());

  return (
    apartmentPlaceLatinized !== apartmentAddressLatinized &&
    !apartmentAddressLatinized.startsWith(apartmentPlaceLatinized)
  );
};

const getAddressValue = (apartment: Apartment): string => {
  let addressValue = apartment.address;
  if (isPlaceIncluded(apartment)) {
    addressValue += `, ${apartment.place}`;
  }
  if (isMunicipalityIncluded(apartment)) {
    addressValue += `, ${apartment.municipality}`;
  }

  return addressValue;
};

export const localizeApartment = (apartment: Apartment) => ({
  ...apartment,
  ...(apartment.location && {
    locationUrl: getLocationUrl(apartment.location),
  }),
  floor: handleFloor(apartment.floor),
  furnished: furnishedMap[apartment.furnished],
  structure: structuresMap[apartment.structure],
  addressValue: getAddressValue(apartment),
  isForRent: apartment.rentOrSale === 'rent',
});
