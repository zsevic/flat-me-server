import { localizeApartment } from './apartment.utils';

describe('localizeApartment', () => {
  const testApartment = {
    id: 'provider_id',
    apartmentId: 'id',
    providerName: 'provider',
    coverPhotoUrl: 'photo-url.com',
    address: 'Bulevar kralja Aleksandra',
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
    const address = 'Bulevar kralja Aleksandra';
    const apartment = {
      ...testApartment,
      address,
      place: address,
    };
    const localizedApartment = {
      ...apartment,
      floor: 'u suterenu',
      furnished: 'namešten',
      isForRent: true,
      locationUrl: 'http://www.google.com/maps/place/40,20',
      structure: 'jednoiposoban',
      showMunicipality: true,
      showPlace: false,
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
      floor: 'u suterenu',
      furnished: 'namešten',
      isForRent: true,
      locationUrl: 'http://www.google.com/maps/place/40,20',
      structure: 'jednoiposoban',
      showMunicipality: false,
      showPlace: true,
    };
    expect(localizeApartment(apartment)).toEqual(localizedApartment);
  });
});
