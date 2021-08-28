export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface PaginationParams {
  limitPerPage: number;
  pageNumber: number;
}
