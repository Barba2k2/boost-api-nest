import { Module } from '@nestjs/common';

// Use Cases
import { AuthenticateUserUseCase } from './use-cases/auth/authenticate-user.use-case';
import { CreateUserUseCase } from './use-cases/user/create-user.use-case';
import { GetUserByIdUseCase } from './use-cases/user/get-user-by-id.use-case';
import { UpdateLastLoginUseCase } from './use-cases/user/update-last-login.use-case';
import { UpdateUserTokensUseCase } from './use-cases/user/update-user-tokens.use-case';

// Repository Interfaces
import { STREAMER_REPOSITORY_TOKEN } from './ports/repositories/streamer.repository.interface';
import { USER_REPOSITORY_TOKEN } from './ports/repositories/user.repository.interface';

// Repository Implementations
import { StreamerRepository } from '@infrastructure/persistence/prisma/repositories/streamer.repository';
import { UserRepository } from '@infrastructure/persistence/prisma/repositories/user.repository';

// Controllers
import { UserController } from '@presentation/controllers/user.controller';

// External Dependencies
import { CacheRedisModule } from '../infrastructure/cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, CacheRedisModule],
  controllers: [UserController],
  providers: [
    // Use Cases
    CreateUserUseCase,
    GetUserByIdUseCase,
    UpdateLastLoginUseCase,
    UpdateUserTokensUseCase,
    AuthenticateUserUseCase,

    // Repository Implementations
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },
    {
      provide: STREAMER_REPOSITORY_TOKEN,
      useClass: StreamerRepository,
    },
  ],
  exports: [
    CreateUserUseCase,
    GetUserByIdUseCase,
    UpdateLastLoginUseCase,
    UpdateUserTokensUseCase,
    AuthenticateUserUseCase,
    USER_REPOSITORY_TOKEN,
    STREAMER_REPOSITORY_TOKEN,
  ],
})
export class UserModule {}
