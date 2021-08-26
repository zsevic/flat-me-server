import { PaginationParams } from 'common/interfaces/pagination';

export const DELETING_INACTIVE_APARTMENTS = 'DELETING_INACTIVE_APARTMENTS';
export const SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB =
  'SAVING_APARTMENT_LIST_FROM_PROVIDERS_CRON_JOB';
export const SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB =
  'SENDING_NEW_APARTMENTS_FREE_SUBSCRIPTION_CRON_JOB';

export const defaultPaginationParams: PaginationParams = {
  limitPerPage: 50,
  pageNumber: 1,
};

export const emptyResponse = { data: [], total: 0 };
