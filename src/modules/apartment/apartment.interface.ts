import { Location } from 'common/interfaces/location.interface';
import { AdvertiserType } from './enums/advertiser-type.enum';

export class Apartment {
  id: string;

  apartmentId: string;

  providerName: string;

  address: string;

  availableFrom?: Date;

  coverPhotoUrl: string;

  advertiserName?: string;

  advertiserType?: AdvertiserType;

  floor: string;

  heatingTypes: string[];

  furnished?: string;

  lastCheckedAt?: string;

  location?: Location;

  municipality: string;

  place: string;

  postedAt: Date;

  price: number;

  rentOrSale: string;

  size: number;

  structure: number;

  url: string;
}

export interface ApartmentStatus {
  isValid: boolean;

  url?: string;
}
