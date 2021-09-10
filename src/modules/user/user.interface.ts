import { Apartment } from 'modules/apartment/apartment.interface';
import { Filter } from 'modules/filter/filter.interface';

export class User {
  id: string;

  email: string;

  isVerified: boolean;

  subscription: string;

  apartments?: Apartment[];

  filters?: Filter[];
}
