import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '@presentation/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/auth/guards/roles.guard';
import { AuthModule } from './application/auth.module';
import { StreamerModule } from './application/streamer.module';
import { UserModule } from './application/user.module';
import { WebsocketsModule } from './application/websockets.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Carrega variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuração global do JWT
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '365d' },
    }),

    // Módulos da aplicação
    PrismaModule,
    UserModule,
    StreamerModule,
    AuthModule,
    WebsocketsModule,
  ],
  providers: [
    // Configuração de guards globais
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
