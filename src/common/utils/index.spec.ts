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
      const skip = getSkip({ limitPerPage: 20, pageNumber: 20 });

      expect(skip).toEqual(180);
    });
  });

  describe('isEnvironment', () => {
    it('should return boolean value if the current environment is test', () => {
      const isTestEnvironment = isEnvironment('test');

      expect(isTestEnvironment).toEqual(true);
    });

    it('should return boolean value if the current environment is dev', () => {
      const isDevEnvironment = isEnvironment('dev');

      expect(isDevEnvironment).toEqual(false);
    });
  });
});
