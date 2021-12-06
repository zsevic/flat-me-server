import { PaginationParams } from './pagination.interfaces';

export function getSkip(paginationParams: PaginationParams): number {
  return (paginationParams.pageNumber - 1) * paginationParams.limitPerPage;
}

export const toCursorHash = (cursor: string): string =>
  Buffer.from(cursor).toString('base64');

export const fromCursorHash = (cursor: string): string =>
  Buffer.from(cursor, 'base64').toString('ascii');
