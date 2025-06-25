import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BehaviorSubject } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { WebsocketsGateway } from './websockets.gateway';
import { WebsocketsService } from './websockets.service';

describe('WebsocketsGateway', () => {
  let gateway: WebsocketsGateway;
  let websocketsService: jest.Mocked<WebsocketsService>;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  const mockWebsocketsService = {
    scheduleUpdates$: new BehaviorSubject<any>(null),
    notifyScheduleUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketsGateway,
        {
          provide: WebsocketsService,
          useValue: mockWebsocketsService,
        },
      ],
    }).compile();

    gateway = module.get<WebsocketsGateway>(WebsocketsGateway);
    websocketsService = module.get(WebsocketsService);

    // Mock do Server do Socket.IO
    mockServer = {
      emit: jest.fn(),
    } as any;

    // Mock do Socket
    mockSocket = {
      id: 'test-socket-id',
      disconnect: jest.fn(),
    } as any;

    gateway.server = mockServer;

    // Mock do Logger para evitar logs nos testes
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('WebsocketsGateway', () => {
    it('deve ser definido', () => {
      expect(gateway).toBeDefined();
    });

    it('deve ter um servidor WebSocket definido', () => {
      expect(gateway.server).toBeDefined();
    });

    it('deve se inscrever em scheduleUpdates$ no construtor', () => {
      // O subscribe é feito no construtor, então testamos se o Observable existe
      expect(websocketsService.scheduleUpdates$).toBeDefined();
    });
  });

  describe('handleConnection', () => {
    it('deve adicionar cliente à lista de conectados', () => {
      // Arrange
      const initialSize = (gateway as any).connectedClients.size;

      // Act
      gateway.handleConnection(mockSocket);

      // Assert
      expect((gateway as any).connectedClients.size).toBe(initialSize + 1);
      expect((gateway as any).connectedClients.has(mockSocket)).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Client connected: test-socket-id',
      );
    });

    it('deve lidar com múltiplas conexões', () => {
      // Arrange
      const mockSocket2 = { id: 'test-socket-id-2' } as any;
      const mockSocket3 = { id: 'test-socket-id-3' } as any;

      // Act
      gateway.handleConnection(mockSocket);
      gateway.handleConnection(mockSocket2);
      gateway.handleConnection(mockSocket3);

      // Assert
      expect((gateway as any).connectedClients.size).toBe(3);
      expect((gateway as any).connectedClients.has(mockSocket)).toBe(true);
      expect((gateway as any).connectedClients.has(mockSocket2)).toBe(true);
      expect((gateway as any).connectedClients.has(mockSocket3)).toBe(true);
    });
  });

  describe('handleDisconnect', () => {
    it('deve remover cliente da lista de conectados', () => {
      // Arrange
      gateway.handleConnection(mockSocket);
      const sizeAfterConnection = (gateway as any).connectedClients.size;

      // Act
      gateway.handleDisconnect(mockSocket);

      // Assert
      expect((gateway as any).connectedClients.size).toBe(
        sizeAfterConnection - 1,
      );
      expect((gateway as any).connectedClients.has(mockSocket)).toBe(false);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Client disconnected: test-socket-id',
      );
    });

    it('deve lidar com desconexão de cliente não conectado', () => {
      // Arrange
      const initialSize = (gateway as any).connectedClients.size;

      // Act
      gateway.handleDisconnect(mockSocket);

      // Assert
      expect((gateway as any).connectedClients.size).toBe(initialSize);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Client disconnected: test-socket-id',
      );
    });
  });

  describe('broadcastScheduleUpdate', () => {
    it('deve emitir evento de atualização de schedule', () => {
      // Arrange
      const updateData = {
        type: 'SCHEDULE_UPDATE',
        data: { scheduleId: 1, action: 'update' },
      };

      // Act
      (gateway as any).broadcastScheduleUpdate(updateData);

      // Assert
      expect(mockServer.emit).toHaveBeenCalledWith(
        'schedule-update',
        updateData,
      );
    });

    it('deve lidar com diferentes tipos de dados de atualização', () => {
      // Arrange
      const updateData1 = { type: 'CREATE', data: { id: 1 } };
      const updateData2 = { type: 'DELETE', data: { id: 2 } };

      // Act
      (gateway as any).broadcastScheduleUpdate(updateData1);
      (gateway as any).broadcastScheduleUpdate(updateData2);

      // Assert
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
      expect(mockServer.emit).toHaveBeenNthCalledWith(
        1,
        'schedule-update',
        updateData1,
      );
      expect(mockServer.emit).toHaveBeenNthCalledWith(
        2,
        'schedule-update',
        updateData2,
      );
    });
  });

  describe('scheduleUpdates$ subscription', () => {
    it('deve fazer broadcast quando receber atualização do service', () => {
      // Arrange
      const updateData = {
        type: 'SCHEDULE_UPDATE',
        data: { scheduleId: 1, action: 'update' },
      };

      // Spy no método privado para verificar se foi chamado
      const broadcastSpy = jest.spyOn(
        gateway as any,
        'broadcastScheduleUpdate',
      );

      // Act
      mockWebsocketsService.scheduleUpdates$.next(updateData);

      // Assert
      expect(broadcastSpy).toHaveBeenCalledWith(updateData);
    });

    it('deve ignorar valores null do service', () => {
      // Arrange
      const broadcastSpy = jest.spyOn(
        gateway as any,
        'broadcastScheduleUpdate',
      );

      // Act
      mockWebsocketsService.scheduleUpdates$.next(null);

      // Assert
      expect(broadcastSpy).not.toHaveBeenCalled();
    });

    it('deve continuar funcionando após múltiplas atualizações', () => {
      // Arrange
      const broadcastSpy = jest.spyOn(
        gateway as any,
        'broadcastScheduleUpdate',
      );
      const update1 = { type: 'UPDATE', data: { id: 1 } };
      const update2 = { type: 'CREATE', data: { id: 2 } };

      // Act
      mockWebsocketsService.scheduleUpdates$.next(update1);
      mockWebsocketsService.scheduleUpdates$.next(null);
      mockWebsocketsService.scheduleUpdates$.next(update2);

      // Assert
      expect(broadcastSpy).toHaveBeenCalledTimes(2);
      expect(broadcastSpy).toHaveBeenNthCalledWith(1, update1);
      expect(broadcastSpy).toHaveBeenNthCalledWith(2, update2);
    });
  });

  describe('connectedClients management', () => {
    it('deve manter lista de clientes conectados', () => {
      // Arrange
      const socket1 = { id: 'client-1' } as any;
      const socket2 = { id: 'client-2' } as any;

      // Act
      gateway.handleConnection(socket1);
      gateway.handleConnection(socket2);

      // Assert
      expect((gateway as any).connectedClients.size).toBe(2);

      // Act
      gateway.handleDisconnect(socket1);

      // Assert
      expect((gateway as any).connectedClients.size).toBe(1);
      expect((gateway as any).connectedClients.has(socket2)).toBe(true);
    });

    it('deve inicializar com Set vazio', () => {
      expect((gateway as any).connectedClients).toBeInstanceOf(Set);
      expect((gateway as any).connectedClients.size).toBe(0);
    });
  });
});
