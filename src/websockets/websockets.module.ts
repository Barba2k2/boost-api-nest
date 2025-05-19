import { Module } from '@nestjs/common';
import { WebsocketsService } from './websockets.service';
import { WebsocketsGateway } from './websockets.gateway';

@Module({
  providers: [WebsocketsService, WebsocketsGateway],
  exports: [WebsocketsService],
})
export class WebsocketsModule {}
