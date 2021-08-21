import { capitalizeWords, isEnvironment } from '.';

describe('utils', () => {
  describe('capitalizeWords', () => {
    it('should return capitalized words from the given input', () => {
      const capitalizedWords = capitalizeWords('two words');

      expect(capitalizedWords).toEqual('Two Words');
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
