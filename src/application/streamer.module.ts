import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Use Cases
import { CreateStreamerUseCase } from './use-cases/streamer/create-streamer.use-case';
import { GetAllStreamersUseCase } from './use-cases/streamer/get-all-streamers.use-case';
import { UpdateStreamerUseCase } from './use-cases/streamer/update-streamer.use-case';

// Repository Tokens
import { STREAMER_REPOSITORY_TOKEN } from './ports/repositories/streamer.repository.interface';

// Repository Implementations
import { StreamerRepository } from '@infrastructure/persistence/prisma/repositories/streamer.repository';

// Controllers
import { StreamerController } from '@presentation/controllers/streamer.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StreamerController],
  providers: [
    // Use Cases
    CreateStreamerUseCase,
    GetAllStreamersUseCase,
    UpdateStreamerUseCase,

    // Repository Implementations
    {
      provide: STREAMER_REPOSITORY_TOKEN,
      useClass: StreamerRepository,
    },
  ],
  exports: [
    CreateStreamerUseCase,
    GetAllStreamersUseCase,
    UpdateStreamerUseCase,
    STREAMER_REPOSITORY_TOKEN,
  ],
})
export class StreamerModule {}
