import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Use Cases
import { CreateStreamerUseCase } from './use-cases/streamer/create-streamer.use-case';
import { GetAllStreamersUseCase } from './use-cases/streamer/get-all-streamers.use-case';
import { GetOnlineStreamersUseCase } from './use-cases/streamer/get-online-streamers.use-case';
import { UpdateStreamerOnlineStatusUseCase } from './use-cases/streamer/update-streamer-online-status.use-case';
import { UpdateStreamerUseCase } from './use-cases/streamer/update-streamer.use-case';

// Repository Tokens
import { STREAMER_REPOSITORY_TOKEN } from './ports/repositories/streamer.repository.interface';

// Repository Implementations
import { StreamerRepository } from '@infrastructure/persistence/prisma/repositories/streamer.repository';

// Controllers
import { StreamerController } from '@presentation/controllers/streamer.controller';

// External Dependencies
import { CacheRedisModule } from '../infrastructure/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheRedisModule],
  controllers: [StreamerController],
  providers: [
    // Use Cases
    CreateStreamerUseCase,
    GetAllStreamersUseCase,
    GetOnlineStreamersUseCase,
    UpdateStreamerUseCase,
    UpdateStreamerOnlineStatusUseCase,

    // Repository Implementations
    {
      provide: STREAMER_REPOSITORY_TOKEN,
      useClass: StreamerRepository,
    },
  ],
  exports: [
    CreateStreamerUseCase,
    GetAllStreamersUseCase,
    GetOnlineStreamersUseCase,
    UpdateStreamerUseCase,
    UpdateStreamerOnlineStatusUseCase,
    STREAMER_REPOSITORY_TOKEN,
  ],
})
export class StreamerModule {}
