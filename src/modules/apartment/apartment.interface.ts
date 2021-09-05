import { Location } from 'common/interfaces/location.interface';

export interface Apartment {
  _id: string;

  apartmentId: string;

  providerName: string;

  address: string;

  availableFrom?: string;

  coverPhotoUrl: string;

  floor: string;

  heatingTypes: string[];

  furnished: string;

  location?: Location;

  municipality: string;

  place: string;

  postedAt: string;

  price: number;

  rentOrSale: string;

  size: number;

  structure: number;

  url: string;
}
