import { FilterDto } from './dto/filter.dto';
import { RentOrSale } from './filter.enums';

export const FURNISHED = ['empty', 'furnished', 'semi-furnished'];

export const MUNICIPALITIES = [
  'Čukarica',
  'Novi Beograd',
  'Palilula',
  'Rakovica',
  'Savski venac',
  'Stari grad',
  'Voždovac',
  'Vračar',
  'Zemun',
  'Zvezdara',
];

export const floorFilters = {
  'not-ground-floor': [
    'cellar',
    'basement',
    'low ground floor',
    'ground floor',
    'high ground floor',
  ],
  'not-attic': ['attic'],
};

export const STRUCTURES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

const baseFilter = {
  minPrice: 0,
  furnished: FURNISHED,
  structures: STRUCTURES,
  municipalities: MUNICIPALITIES,
};

const rentFilter: FilterDto = {
  ...baseFilter,
  maxPrice: 500,
  rentOrSale: RentOrSale.rent,
};

const saleFilter: FilterDto = {
  ...baseFilter,
  maxPrice: 200000,
  rentOrSale: RentOrSale.sale,
};

export const filters = [rentFilter, saleFilter];
