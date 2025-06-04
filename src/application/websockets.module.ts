import { Module } from '@nestjs/common';
import { WebsocketsGateway } from '@presentation/websockets/websockets.gateway';
import { WebsocketsService } from '@presentation/websockets/websockets.service';

@Module({
  providers: [WebsocketsGateway, WebsocketsService],
  exports: [WebsocketsService],
})
export class WebsocketsModule {}
