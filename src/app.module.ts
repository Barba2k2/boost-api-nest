import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StreamersModule } from './streamers/streamers.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ScoresModule } from './scores/scores.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

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
    UsersModule,
    AuthModule,
    StreamersModule,
    SchedulesModule,
    ScoresModule,
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
