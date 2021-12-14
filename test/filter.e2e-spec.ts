import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CustomValidationPipe } from 'common/pipes';
import { AppModule } from 'modules/app/app.module';

jest.mock('typeorm-transactional-cls-hooked', () => ({
  Transactional: () => () => ({}),
  initializeTransactionalContext: () => ({}),
  patchTypeORMRepositoryWithBaseRepository: () => ({}),
  BaseRepository: class {},
}));

describe('FilterController (e2e)', () => {
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

  describe('/filters/verify/:token (POST)', () => {
    it('should return 400 status code when token is not valid', () => {
      return request(app.getHttpServer())
        .post('/filters/verify/token')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/filters/deactivate/:token (POST)', () => {
    it('should return 400 status code when token is not valid', () => {
      return request(app.getHttpServer())
        .post('/filters/deactivate/token')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/filters (POST)', () => {
    it('should return 400 status code when filters are not valid', () => {
      return request(app.getHttpServer())
        .post('/filters')
        .send({
          minPrice: 200,
          furnished: ['furnished'],
          structures: [2.5],
          municipalities: ['test'],
          maxPrice: 300,
          rentOrSale: 'rent',
          email: `test-${Math.random() * 1000}@example.com`,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should create a new filter', () => {
      return request(app.getHttpServer())
        .post('/filters')
        .send({
          minPrice: 200,
          furnished: ['furnished'],
          structures: [2.5],
          municipalities: ['Zvezdara', 'Palilula'],
          maxPrice: 300,
          rentOrSale: 'rent',
          email: `test-${Math.random() * 1000}@example.com`,
        })
        .expect(HttpStatus.CREATED);
    });
  });
});
