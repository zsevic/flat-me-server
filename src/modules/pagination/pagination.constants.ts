import { PaginationParams } from './pagination.interfaces';

export const defaultPaginationParams: PaginationParams = {
  limitPerPage: 50,
  pageNumber: 1,
};

export const emptyPaginatedResponse = { data: [], total: 0 };
