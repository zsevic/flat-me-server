import { capitalizeWords, isEnvironment } from '.';

describe('utils', () => {
  describe('capitalizeWords', () => {
    it('should return capitalized words from the given input', () => {
      const capitalizedWords = capitalizeWords('two words');

      expect(capitalizedWords).toEqual('Two Words');
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
