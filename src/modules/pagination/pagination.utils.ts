import { PaginationParams } from './pagination.interfaces';

export function getSkip(paginationParams: PaginationParams): number {
  return (paginationParams.pageNumber - 1) * paginationParams.limitPerPage;
}
