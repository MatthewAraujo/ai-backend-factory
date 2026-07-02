import type { INestApplication } from '@nestjs/common';
import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { AppModule } from '@/infra/app.module';
import { AuthModule } from '@/infra/auth/auth.module';
import type { CurrentUser as CurrentUserView } from '@/infra/auth/current-user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';
import { DatabaseModule } from '@/infra/database/database.module';
import { EnvModule } from '@/infra/env/env.module';
import { InMemoryAccountsRepository } from '../../../../test/repositories/in-memory-accounts-repository';

@Controller('/test-auth')
class TestAuthController {
  @Get('/me')
  @UseGuards(JwtAuthGuard)
  handle(@CurrentUser() currentUser: CurrentUserView) {
    return {
      currentUser,
    };
  }
}

@Module({
  imports: [AuthModule, DatabaseModule, EnvModule],
  controllers: [TestAuthController],
})
class TestAuthModule {}

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let accountsRepository: InMemoryAccountsRepository;

  beforeAll(async () => {
    accountsRepository = new InMemoryAccountsRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, TestAuthModule],
    })
      .overrideProvider(AccountsRepository)
      .useValue(accountsRepository)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('registers a new account', async () => {
    const response = await request(app.getHttpServer()).post('/accounts').send({
      email: 'factory.user@example.com',
      password: 'secret-123',
    });

    expect(response.status).toBe(201);
    expect(response.body.account).toMatchObject({
      email: 'factory.user@example.com',
    });
    expect(response.body.account.id).toEqual(expect.any(String));
    expect(accountsRepository.items[0]?.passwordHash).not.toBe('secret-123');
  });

  it('authenticates with valid credentials and returns a jwt', async () => {
    await request(app.getHttpServer()).post('/accounts').send({
      email: 'auth.user@example.com',
      password: 'secret-123',
    });

    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: 'auth.user@example.com',
      password: 'secret-123',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
    });
  });

  it('rejects invalid credentials', async () => {
    await request(app.getHttpServer()).post('/accounts').send({
      email: 'invalid.user@example.com',
      password: 'secret-123',
    });

    const response = await request(app.getHttpServer()).post('/sessions').send({
      email: 'invalid.user@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
  });

  it('rejects unauthenticated access to a protected route', async () => {
    const response = await request(app.getHttpServer()).get('/test-auth/me');

    expect(response.status).toBe(401);
  });

  it('resolves the authenticated factory user on a protected route', async () => {
    await request(app.getHttpServer()).post('/accounts').send({
      email: 'guard.user@example.com',
      password: 'secret-123',
    });

    const sessionResponse = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        email: 'guard.user@example.com',
        password: 'secret-123',
      });

    const response = await request(app.getHttpServer())
      .get('/test-auth/me')
      .set('authorization', `Bearer ${sessionResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      currentUser: {
        id: expect.any(String),
        email: 'guard.user@example.com',
      },
    });
  });
});
