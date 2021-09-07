import { Filter } from 'modules/filter/filter.interface';

export class User {
  id: string;

  email: string;

  isVerified: boolean;

  subscription: string;

  receivedApartments: string[];

  filters?: Filter[];
}
