import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CustomValidationPipe } from 'common/pipes';
import { AppModule } from 'modules/app/app.module';

jest.mock('typeorm-transactional-cls-hooked', () => ({
  Transactional: () => () => ({}),
  initializeTransactionalContext: () => ({}),
  patchTypeORMRepositoryWithBaseRepository: () => ({}),
  BaseRepository: class {},
}));

describe('ApartmentController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new CustomValidationPipe({
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/apartments/:id (GET)', () => {
    it('should return 400 status code when apartment id is not valid', () => {
      return request(app.getHttpServer())
        .get('/apartments/id')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return isValid value false when apartment is not stored', async () => {
      const response = await request(app.getHttpServer())
        .get('/apartments/haloOglasi_id')
        .expect(HttpStatus.OK);

      expect(response.body.isValid).toEqual(false);
    });
  });

  describe('/apartments (GET)', () => {
    it('should return 400 status code when params are missing', () => {
      return request(app.getHttpServer())
        .get('/apartments')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return 400 status code when params don't have valid values", () => {
      return request(app.getHttpServer())
        .get('/apartments')
        .query({
          minPrice: 200,
          furnished: ['test'],
          structures: [2.5],
          municipalities: ['Zvezdara', 'test'],
          maxPrice: 300,
          rentOrSale: 'rent',
          limitPerPage: 2,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return apartment list based on given params', () => {
      return request(app.getHttpServer())
        .get('/apartments')
        .query({
          minPrice: 200,
          furnished: ['furnished', 'empty'],
          structures: [2.5, 3],
          municipalities: ['Zvezdara', 'Palilula'],
          maxPrice: 300,
          rentOrSale: 'rent',
          limitPerPage: 2,
        })
        .expect(HttpStatus.OK);
    });
  });
});
