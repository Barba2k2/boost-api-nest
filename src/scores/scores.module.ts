import { Module } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { ScoresController } from './scores.controller';
import { PublicScoresController } from './public-scores.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScoresController, PublicScoresController],
  providers: [ScoresService],
})
export class ScoresModule {}
