import { capitalizeWords, getSkip, isEnvironment } from '.';

describe('utils', () => {
  describe('capitalizeWords', () => {
    it('should return capitalized words from the given input', () => {
      const capitalizedWords = capitalizeWords('two words');

      expect(capitalizedWords).toEqual('Two Words');
    });
  });

  describe('getSkip', () => {
    it('should return skip number for given page number and limit per page', () => {
      const skip = getSkip({ limitPerPage: 20, pageNumber: 10 });

      expect(skip).toEqual(180);
    });
  });

  describe('isEnvironment', () => {
    it('should return true for test environment when the current environment is test', () => {
      const isTestEnvironment = isEnvironment('test');

      expect(isTestEnvironment).toEqual(true);
    });

    it('should return false for dev environment when the current environment is test', () => {
      const isDevEnvironment = isEnvironment('dev');

      expect(isDevEnvironment).toEqual(false);
    });
  });
});
