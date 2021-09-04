import { BaseProvider, CetiriZidaProvider, CityExpertProvider } from '.';

describe('BaseProvider', () => {
  describe('createProvider', () => {
    it('should throw an error when provider name is not valid', () => {
      const baseProvider = new BaseProvider();

      expect(() => baseProvider.createProvider('testProvider')).toThrowError(
        Error,
      );
    });

    it('should create cetiriZidaProvider', () => {
      const baseProvider = new BaseProvider();

      const provider = baseProvider.createProvider('cetiriZida');

      expect(provider).toBeInstanceOf(CetiriZidaProvider);
    });

    it('should create cityExpertProvider', () => {
      const baseProvider = new BaseProvider();

      const provider = baseProvider.createProvider('cityExpert');

      expect(provider).toBeInstanceOf(CityExpertProvider);
    });
  });
});
