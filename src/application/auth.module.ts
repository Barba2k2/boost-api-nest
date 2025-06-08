import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Use Cases
import { GenerateTokensUseCase } from './use-cases/auth/generate-tokens.use-case';
import { GetLoginLogsUseCase } from './use-cases/auth/get-login-logs.use-case';
import { RefreshTokenUseCase } from './use-cases/auth/refresh-token.use-case';
import { RegisterUserUseCase } from './use-cases/auth/register-user.use-case';
import { SendWelcomeEmailUseCase } from './use-cases/auth/send-welcome-email.use-case';
import { ValidateUserUseCase } from './use-cases/auth/validate-user.use-case';

// Casos de uso do User Module
import { CreateUserUseCase } from './use-cases/user/create-user.use-case';
import { UpdateLastLoginUseCase } from './use-cases/user/update-last-login.use-case';
import { UpdateUserTokensUseCase } from './use-cases/user/update-user-tokens.use-case';

// Repository Tokens
import { STREAMER_REPOSITORY_TOKEN } from './ports/repositories/streamer.repository.interface';
import { USER_REPOSITORY_TOKEN } from './ports/repositories/user.repository.interface';

// Repository Implementations
import { StreamerRepository } from '@infrastructure/persistence/prisma/repositories/streamer.repository';
import { UserRepository } from '@infrastructure/persistence/prisma/repositories/user.repository';

// Controllers
import { AuthController } from '@presentation/controllers/auth.controller';

// Guards e Strategies
import { JwtStrategy } from '@presentation/auth/strategies/jwt.strategy';
import { LocalStrategy } from '@presentation/auth/strategies/local.strategy';

// Dependências externas
import { EmailModule } from '@infrastructure/email/email.module';
import { CacheRedisModule } from '../infrastructure/cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    CacheRedisModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Auth Use Cases
    RegisterUserUseCase,
    ValidateUserUseCase,
    GenerateTokensUseCase,
    RefreshTokenUseCase,
    GetLoginLogsUseCase,
    SendWelcomeEmailUseCase,

    // User Use Cases (dependências)
    CreateUserUseCase,
    UpdateLastLoginUseCase,
    UpdateUserTokensUseCase,

    // Repository Implementations
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },
    {
      provide: STREAMER_REPOSITORY_TOKEN,
      useClass: StreamerRepository,
    },

    // Strategies
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [
    RegisterUserUseCase,
    ValidateUserUseCase,
    GenerateTokensUseCase,
    RefreshTokenUseCase,
    JwtStrategy,
    LocalStrategy,
  ],
})
export class AuthModule {}
