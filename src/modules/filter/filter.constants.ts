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
    'semi-basement',
    'low ground floor',
    'ground floor',
    'high ground floor',
  ],
  'not-attic': ['attic'],
};

export const STRUCTURES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

const baseFilter = {
  minPrice: 0,
  structures: STRUCTURES,
  municipalities: MUNICIPALITIES,
};

const rentFilter: FilterDto = {
  ...baseFilter,
  furnished: FURNISHED,
  maxPrice: 2000,
  rentOrSale: RentOrSale.rent,
};

const saleFilter: FilterDto = {
  ...baseFilter,
  furnished: [],
  maxPrice: 500000,
  rentOrSale: RentOrSale.sale,
};

export const filters = [rentFilter, saleFilter];
