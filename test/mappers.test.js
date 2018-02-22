import mappers from '../src/mappers';

describe('mappers', () => {
  test("has 'Currency' mapper", () => {
    expect(mappers.mappers).toHaveProperty('Currency');
  });
});
