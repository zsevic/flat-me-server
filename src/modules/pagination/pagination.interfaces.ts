export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pageInfo: PageInfo;
}

export interface PaginationParams {
  limitPerPage: number;
  pageNumber: number;
}
