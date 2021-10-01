import { User } from 'modules/user/user.interface';

export interface Filter {
  id?: string;

  furnished: string[];

  floor?: string[];

  isActive: boolean;

  isVerified: boolean;

  minPrice: number;

  maxPrice: number;

  municipalities: string[];

  rentOrSale: string;

  structures: number[];

  userId: string;

  user?: User;

  createdAt?: Date;
}
