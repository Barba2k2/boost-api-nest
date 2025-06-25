import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Use Cases
import { GetReportByNicknameUseCase } from '@application/use-cases/streamer/get-report-by-nickname.use-case';
import { CreateScoreUseCase } from './use-cases/streamer/create-score.use-case';
import { GetAdminPeriodSummaryUseCase } from './use-cases/streamer/get-admin-period-summary.use-case';
import { GetAllStreamersUseCase } from './use-cases/streamer/get-all-streamers.use-case';
import { GetDailyPointsUseCase } from './use-cases/streamer/get-daily-points.use-case';
import { GetDailyScoresWeekUseCase } from './use-cases/streamer/get-daily-scores-week.use-case';
import { GetOnlineStreamersUseCase } from './use-cases/streamer/get-online-streamers.use-case';
import { GetScoreReportUseCase } from './use-cases/streamer/get-score-report.use-case';
import { GetScoresByHourUseCase } from './use-cases/streamer/get-scores-by-hour.use-case';
import { GetWeeklyAverageUseCase } from './use-cases/streamer/get-weekly-average.use-case';
import { GetWeeklyRankingUseCase } from './use-cases/streamer/get-weekly-ranking.use-case';
import { UpdateStreamerOnlineStatusUseCase } from './use-cases/streamer/update-streamer-online-status.use-case';
import { UpdateStreamerUseCase } from './use-cases/streamer/update-streamer.use-case';

// Repository Tokens
import { SCORE_REPOSITORY_TOKEN } from './ports/repositories/score.repository.interface';
import { STREAMER_REPOSITORY_TOKEN } from './ports/repositories/streamer.repository.interface';

// Repository Implementations
import { ScoreReportRepository } from '@infrastructure/persistence/prisma/repositories/score-report.repository';
import { ScoreValidationRepository } from '@infrastructure/persistence/prisma/repositories/score-validation.repository';
import { ScoreRepository } from '@infrastructure/persistence/prisma/repositories/score.repository';
import { StreamerRepository } from '@infrastructure/persistence/prisma/repositories/streamer.repository';

// Controllers
import { AdminScoreController } from '@presentation/controllers/admin-score.controller';
import { PublicScoreController } from '@presentation/controllers/public-score.controller';
import { ScoreController } from '@presentation/controllers/score.controller';
import { StreamerController } from '@presentation/controllers/streamer.controller';

// External Dependencies
import { UpdateMyStreamerUseCase } from '@application/use-cases/streamer/update-my-streamer.use-case';
import { CacheRedisModule } from '../infrastructure/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheRedisModule],
  controllers: [
    StreamerController,
    ScoreController,
    PublicScoreController,
    AdminScoreController,
  ],
  providers: [
    // Use Cases
    GetAllStreamersUseCase,
    GetOnlineStreamersUseCase,
    UpdateStreamerUseCase,
    UpdateMyStreamerUseCase,
    UpdateStreamerOnlineStatusUseCase,
    CreateScoreUseCase,
    GetScoreReportUseCase,
    GetScoresByHourUseCase,
    GetDailyPointsUseCase,
    GetWeeklyRankingUseCase,
    GetWeeklyAverageUseCase,
    GetDailyScoresWeekUseCase,
    GetReportByNicknameUseCase,
    GetAdminPeriodSummaryUseCase,

    // Repository Implementations
    {
      provide: STREAMER_REPOSITORY_TOKEN,
      useClass: StreamerRepository,
    },
    {
      provide: SCORE_REPOSITORY_TOKEN,
      useClass: ScoreRepository,
    },
    ScoreValidationRepository,
    ScoreReportRepository,
  ],
  exports: [
    GetAllStreamersUseCase,
    GetOnlineStreamersUseCase,
    UpdateStreamerUseCase,
    UpdateMyStreamerUseCase,
    UpdateStreamerOnlineStatusUseCase,
    CreateScoreUseCase,
    GetScoreReportUseCase,
    GetScoresByHourUseCase,
    GetDailyPointsUseCase,
    GetWeeklyRankingUseCase,
    GetWeeklyAverageUseCase,
    GetDailyScoresWeekUseCase,
    GetReportByNicknameUseCase,
    GetAdminPeriodSummaryUseCase,
    STREAMER_REPOSITORY_TOKEN,
    SCORE_REPOSITORY_TOKEN,
  ],
})
export class StreamerModule {}
