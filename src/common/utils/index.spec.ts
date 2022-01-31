import { capitalizeWords, isEnvironment } from '.';

describe('utils', () => {
  describe('capitalizeWords', () => {
    it('should return capitalized words from the given input with open bracket', () => {
      const capitalizedWords = capitalizeWords('Blok 67 (belvil)');

      expect(capitalizedWords).toEqual('Blok 67 - Belvil');
    });

    it('should return capitalized words from the given input with single-letter words', () => {
      const capitalizedWords = capitalizeWords('test a');

      expect(capitalizedWords).toEqual('Test A');
    });

    it('should return capitalized words from the given input with short words', () => {
      const capitalizedWords = capitalizeWords('test ab');

      expect(capitalizedWords).toEqual('Test Ab');
    });

    it('should return capitalized words from the given input with unclosed brackets', () => {
      const capitalizedWords = capitalizeWords('test ab(');

      expect(capitalizedWords).toEqual('Test Ab');
    });

    it('should return capitalized words from the given input with unpaired brackets', () => {
      const capitalizedWords = capitalizeWords('test ab)');

      expect(capitalizedWords).toEqual('Test Ab');
    });

    it('should return capitalized words from the given input with a slash', () => {
      const capitalizedWords = capitalizeWords('Cvetni Trg / Manjež');

      expect(capitalizedWords).toEqual('Cvetni Trg - Manjež');
    });

    it('should return capitalized words from the given input with open bracket without space', () => {
      const capitalizedWords = capitalizeWords('Blok 67(belvil)');

      expect(capitalizedWords).toEqual('Blok 67 - Belvil');
    });

    it('should return capitalized words from the given input with handled hyphen', () => {
      const capitalizedWords = capitalizeWords('Blok 25 - Arena');

      expect(capitalizedWords).toEqual('Blok 25 - Arena');
    });

    it('should return capitalized words from the given input', () => {
      const capitalizedWords = capitalizeWords('Gradska bolnica');

      expect(capitalizedWords).toEqual('Gradska Bolnica');
    });

    it('should handle Roman numbers', () => {
      const capitalizedWords = capitalizeWords('Karaburma II');

      expect(capitalizedWords).toEqual('Karaburma II');
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
