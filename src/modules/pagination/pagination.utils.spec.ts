import { getSkip } from './pagination.utils';

describe('getSkip', () => {
  it('should return skip number for given page number and limit per page', () => {
    const skip = getSkip({ limitPerPage: 20, pageNumber: 10 });

    expect(skip).toEqual(180);
  });
});
