import path from 'path';

export const SERBIAN_LOCALE = 'sr';

export const i18nConfig = {
  locales: [SERBIAN_LOCALE],
  defaultLocale: SERBIAN_LOCALE,
  directory: path.join(process.cwd(), 'dist/assets/i18n'),
  register: global,
};
