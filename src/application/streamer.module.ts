import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Use Cases
import { CreateScoreUseCase } from './use-cases/streamer/create-score.use-case';
import { CreateStreamerUseCase } from './use-cases/streamer/create-streamer.use-case';
import { GetAllStreamersUseCase } from './use-cases/streamer/get-all-streamers.use-case';
import { GetDailyPointsUseCase } from './use-cases/streamer/get-daily-points.use-case';
import { GetOnlineStreamersUseCase } from './use-cases/streamer/get-online-streamers.use-case';
import { UpdateStreamerOnlineStatusUseCase } from './use-cases/streamer/update-streamer-online-status.use-case';
import { UpdateStreamerUseCase } from './use-cases/streamer/update-streamer.use-case';

// Repository Tokens
import { STREAMER_REPOSITORY_TOKEN } from './ports/repositories/streamer.repository.interface';
import { SCORE_REPOSITORY_TOKEN } from './use-cases/streamer/create-score.use-case';

// Repository Implementations
import { ScoreRepository } from '@infrastructure/persistence/prisma/repositories/score.repository';
import { StreamerRepository } from '@infrastructure/persistence/prisma/repositories/streamer.repository';

// Controllers
import { ScoreController } from '@presentation/controllers/score.controller';
import { StreamerController } from '@presentation/controllers/streamer.controller';

// External Dependencies
import { CacheRedisModule } from '../infrastructure/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheRedisModule],
  controllers: [StreamerController, ScoreController],
  providers: [
    // Use Cases
    CreateStreamerUseCase,
    GetAllStreamersUseCase,
    GetOnlineStreamersUseCase,
    UpdateStreamerUseCase,
    UpdateStreamerOnlineStatusUseCase,
    CreateScoreUseCase,
    GetDailyPointsUseCase,

    // Repository Implementations
    {
      provide: STREAMER_REPOSITORY_TOKEN,
      useClass: StreamerRepository,
    },
    {
      provide: SCORE_REPOSITORY_TOKEN,
      useClass: ScoreRepository,
    },
  ],
  exports: [
    CreateStreamerUseCase,
    GetAllStreamersUseCase,
    GetOnlineStreamersUseCase,
    UpdateStreamerUseCase,
    UpdateStreamerOnlineStatusUseCase,
    CreateScoreUseCase,
    GetDailyPointsUseCase,
    STREAMER_REPOSITORY_TOKEN,
    SCORE_REPOSITORY_TOKEN,
  ],
})
export class StreamerModule {}
