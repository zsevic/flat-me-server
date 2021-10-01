import { isEnvironment } from 'common/utils';

export const FILTER_DEACTIVATION_LIMIT = !isEnvironment('production')
  ? Infinity
  : 3;
export const FILTER_DEACTIVATION_TTL = 60 * 60 * 24;

export const FILTER_SAVING_LIMIT = !isEnvironment('production') ? Infinity : 3;
export const FILTER_SAVING_TTL = 60 * 60 * 24;

export const FILTER_VERIFICATION_LIMIT = !isEnvironment('production')
  ? Infinity
  : 3;
export const FILTER_VERIFICATION_TTL = 60 * 60 * 24;
