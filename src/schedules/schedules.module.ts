import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [PrismaModule, WebsocketsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
