import { PaginationParams } from 'common/interfaces/pagination';

export function capitalizeWords(words: string): string {
  return words
    .split(' ')
    .filter(word => word.length !== 0)
    .map(word => word[0].toUpperCase() + word.substr(1).toLowerCase())
    .join(' ');
}

export function getSkip(paginationParams: PaginationParams): number {
  return (paginationParams.pageNumber - 1) * paginationParams.limitPerPage;
}

export function isEnvironment(environment: string): boolean {
  return process.env.NODE_ENV === environment;
}
