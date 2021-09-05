import { PaginationParams } from './pagination.interfaces';

export const defaultPaginationParams: PaginationParams = {
  limitPerPage: 50,
  pageNumber: 1,
};

export const emptyPaginatedResponse = { data: [], total: 0 };

export const DEFAULT_LIMIT_PER_PAGE = 10;
export const DEFAULT_PAGE_NUMBER = 1;
