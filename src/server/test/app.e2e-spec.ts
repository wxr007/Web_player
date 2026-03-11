import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // 复制主应用的配置
    app.setGlobalPrefix('api');
    app.enableCors();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(res => {
        expect(res.body.status).toBe('ok');
        expect(res.body.database).toHaveProperty('connected');
      });
  });

  it('/api/health/db (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health/db')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('status');
      });
  });
});
