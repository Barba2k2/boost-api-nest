import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WebsocketsService } from './websockets.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients: Set<Socket> = new Set();
  private readonly logger = new Logger(WebsocketsGateway.name);

  constructor(private websocketsService: WebsocketsService) {
    // Subscreve-se para receber atualizações de agendamentos
    this.websocketsService.scheduleUpdates$.subscribe((update) => {
      if (update) {
        this.broadcastScheduleUpdate(update);
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.add(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client);
  }

  private broadcastScheduleUpdate(update: any) {
    this.server.emit('schedule-update', update);
  }
}
