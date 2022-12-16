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

describe('FeedbackController (e2e)', () => {
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

  describe('/feedbacks (POST)', () => {
    it('should return 400 status code when feedback is not valid', () => {
      return request(app.getHttpServer())
        .post('/feedbacks')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it.skip('should return 200 status code when feedback is sent', () => {
      return request(app.getHttpServer())
        .post('/feedbacks')
        .send({
          text: 'feedback',
        })
        .expect(HttpStatus.OK);
    });
  });
});
