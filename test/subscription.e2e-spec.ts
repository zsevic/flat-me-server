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

describe('SubscriptionController (e2e)', () => {
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

  describe('/subscriptions/notifications/subscribe (POST)', () => {
    it('should return 400 status code when params are missing', () => {
      return request(app.getHttpServer())
        .post('/subscriptions/notifications/subscribe')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it("should return 400 status code when params don't have valid values", () => {
      return request(app.getHttpServer())
        .post('/subscriptions/notifications/subscribe')
        .send({
          token: 'token',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 201 status code when subscription is created', async () => {
      const response = await request(app.getHttpServer())
        .post('/subscriptions/notifications/subscribe')
        .send({
          token: 'token' + Math.random() * 1000,
          filter: {
            rentOrSale: 'rent',
            municipalities: ['Palilula'],
            structures: [1, 1.5],
            furnished: ['semi-furnished'],
            minPrice: 200,
            maxPrice: 300,
          },
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({ isUpdated: false });
    });
  });
});
