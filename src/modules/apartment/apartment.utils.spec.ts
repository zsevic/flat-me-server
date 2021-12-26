import { localizeApartment } from './apartment.utils';

describe('localizeApartment', () => {
  const testApartment = {
    id: 'provider_id',
    apartmentId: 'id',
    providerName: 'provider',
    coverPhotoUrl: 'photo-url.com',
    address: 'Ulica 23',
    floor: 'basement',
    furnished: 'furnished',
    heatingTypes: ['district'],
    municipality: 'Zemun',
    place: 'Zemun',
    postedAt: new Date(),
    price: 200,
    rentOrSale: 'rent',
    size: 34,
    structure: 1.5,
    location: {
      latitude: 40,
      longitude: 20,
    },
    url: 'apartment-url.com',
  };

  it('should skip place when place and address have the same value', () => {
    const address = 'Ulica 23';
    const apartment = {
      ...testApartment,
      address,
      place: address,
    };
    const localizedApartment = {
      ...apartment,
      addressValue: 'Ulica 23, Zemun',
      floor: 'u suterenu',
      furnished: 'namešten',
      isForRent: true,
      locationUrl: 'http://www.google.com/maps/place/40,20',
      structure: 'jednoiposoban',
    };
    expect(localizeApartment(apartment)).toEqual(localizedApartment);
  });

  it('should skip place when address starts with place value', () => {
    const address = 'Ulica 23';
    const apartment = {
      ...testApartment,
      address,
      place: 'Ulica',
    };
    const localizedApartment = {
      ...apartment,
      addressValue: 'Ulica 23, Zemun',
      floor: 'u suterenu',
      furnished: 'namešten',
      isForRent: true,
      locationUrl: 'http://www.google.com/maps/place/40,20',
      structure: 'jednoiposoban',
    };
    expect(localizeApartment(apartment)).toEqual(localizedApartment);
  });

  it('should skip municipality when place and municipality have the same value', () => {
    const apartment = {
      ...testApartment,
      place: 'Zemun',
      municipality: 'Zemun',
    };
    const localizedApartment = {
      ...apartment,
      addressValue: 'Ulica 23, Zemun',
      floor: 'u suterenu',
      furnished: 'namešten',
      isForRent: true,
      locationUrl: 'http://www.google.com/maps/place/40,20',
      structure: 'jednoiposoban',
    };
    expect(localizeApartment(apartment)).toEqual(localizedApartment);
  });
});
