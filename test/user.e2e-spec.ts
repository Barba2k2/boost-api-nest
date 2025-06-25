import { UserModule } from '@application/user.module';
import { UserRole } from '@domain/entities/user.entity';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PrismaModule } from '../src/prisma/prisma.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        PrismaModule,
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('deve criar um usuário com dados válidos', () => {
      const createUserDto = {
        nickname: 'testuser-e2e',
        password: 'Password@123',
        role: UserRole.USER,
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.nickname).toBe('testuser-e2e');
          expect(res.body.role).toBe(UserRole.USER);
          expect(res.body.id).toBeDefined();
          expect(res.body.password).toBeUndefined(); // Password não deve ser retornada
        });
    });

    it('deve retornar 400 para dados inválidos', () => {
      const invalidUserDto = {
        nickname: 'ab', // Muito curto
        password: '123', // Muito simples
        role: 'invalid-role',
      };

      return request(app.getHttpServer())
        .post('/users')
        .send(invalidUserDto)
        .expect(400);
    });

    it('deve retornar 409 para nickname duplicado', async () => {
      const createUserDto = {
        nickname: 'duplicate-user',
        password: 'Password@123',
        role: UserRole.USER,
      };

      // Criar o primeiro usuário
      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Tentar criar novamente com mesmo nickname
      return request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(409);
    });
  });

  describe('/users/:id (GET)', () => {
    let userId: number;

    beforeEach(async () => {
      const createUserDto = {
        nickname: 'testuser-get',
        password: 'Password@123',
        role: UserRole.USER,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      userId = response.body.id;
    });

    it('deve retornar um usuário existente', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
          expect(res.body.nickname).toBe('testuser-get');
          expect(res.body.role).toBe(UserRole.USER);
          expect(res.body.password).toBeUndefined();
        });
    });

    it('deve retornar 404 para usuário inexistente', () => {
      return request(app.getHttpServer()).get('/users/99999').expect(404);
    });

    it('deve retornar 400 para ID inválido', () => {
      return request(app.getHttpServer()).get('/users/invalid-id').expect(400);
    });
  });

  describe('/users/:id/tokens (PATCH)', () => {
    let userId: number;

    beforeEach(async () => {
      const createUserDto = {
        nickname: 'testuser-tokens',
        password: 'Password@123',
        role: UserRole.USER,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      userId = response.body.id;
    });

    it('deve atualizar tokens do usuário', () => {
      const updateTokensDto = {
        refreshToken: 'new-refresh-token',
        webToken: 'new-web-token',
        windowsToken: 'new-windows-token',
      };

      return request(app.getHttpServer())
        .patch(`/users/${userId}/tokens`)
        .send(updateTokensDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
          expect(res.body.nickname).toBe('testuser-tokens');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('deve atualizar apenas alguns tokens', () => {
      const partialUpdateDto = {
        refreshToken: 'only-refresh-token',
      };

      return request(app.getHttpServer())
        .patch(`/users/${userId}/tokens`)
        .send(partialUpdateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(userId);
          expect(res.body.nickname).toBe('testuser-tokens');
        });
    });

    it('deve retornar 404 para usuário inexistente', () => {
      const updateTokensDto = {
        refreshToken: 'new-refresh-token',
      };

      return request(app.getHttpServer())
        .patch('/users/99999/tokens')
        .send(updateTokensDto)
        .expect(404);
    });
  });
});
