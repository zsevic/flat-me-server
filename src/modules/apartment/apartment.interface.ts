import { Location } from 'common/interfaces/location.interface';

export interface Apartment {
  id: string;

  apartmentId: string;

  providerName: string;

  address: string;

  availableFrom?: Date;

  coverPhotoUrl: string;

  floor: string;

  heatingTypes: string[];

  furnished: string;

  location?: Location;

  municipality: string;

  place: string;

  postedAt?: Date;

  price: number;

  rentOrSale: string;

  size: number;

  structure: number;

  url: string;
}