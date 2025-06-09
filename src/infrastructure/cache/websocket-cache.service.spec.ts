import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import {
  SocketConnection,
  SocketRoom,
  WebSocketCacheService,
} from './websocket-cache.service';

describe('WebSocketCacheService', () => {
  let service: WebSocketCacheService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    setex: jest.fn(),
    has: jest.fn(),
    incr: jest.fn(),
    mset: jest.fn(),
    mget: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketCacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<WebSocketCacheService>(WebSocketCacheService);
    redisService = module.get(RedisService);

    // Mock Date.now para testes determinísticos
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('registerConnection', () => {
    it('deve registrar uma nova conexão com usuário e metadata', async () => {
      // Arrange
      const socketId = 'socket123';
      const userId = 1;
      const metadata = {
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
        room: 'general',
      };

      redisService.setex.mockResolvedValue();
      redisService.get.mockResolvedValue([]); // Lista vazia de sockets do usuário

      // Act
      await service.registerConnection(socketId, userId, metadata);

      // Assert
      const expectedConnection: SocketConnection = {
        socketId: 'socket123',
        userId: 1,
        connectionTime: 1640995200000,
        lastActivity: 1640995200000,
        metadata,
      };

      expect(redisService.setex).toHaveBeenCalledWith(
        'socket:socket123',
        86400,
        expectedConnection,
      );

      // Verificar se foi adicionado à lista de sockets do usuário
      expect(redisService.get).toHaveBeenCalledWith('user_sockets:1');
    });

    it('deve registrar conexão sem usuário e metadata', async () => {
      // Arrange
      const socketId = 'socket456';
      redisService.setex.mockResolvedValue();

      // Act
      await service.registerConnection(socketId);

      // Assert
      const expectedConnection: SocketConnection = {
        socketId: 'socket456',
        userId: undefined,
        connectionTime: 1640995200000,
        lastActivity: 1640995200000,
        metadata: undefined,
      };

      expect(redisService.setex).toHaveBeenCalledWith(
        'socket:socket456',
        86400,
        expectedConnection,
      );

      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('deve adicionar socket à lista existente do usuário', async () => {
      // Arrange
      const socketId = 'socket789';
      const userId = 1;
      const existingSockets = ['socket_old'];

      redisService.setex.mockResolvedValue();
      redisService.get.mockResolvedValue(existingSockets);

      // Act
      await service.registerConnection(socketId, userId);

      // Assert
      expect(redisService.setex).toHaveBeenCalledWith('user_sockets:1', 86400, [
        'socket_old',
        'socket789',
      ]);
    });
  });

  describe('removeConnection', () => {
    it('deve remover conexão com usuário e salas', async () => {
      // Arrange
      const socketId = 'socket123';
      const connection: SocketConnection = {
        socketId,
        userId: 1,
        connectionTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      // Mock mais simples - vou mockar em ordem que são chamados
      redisService.get
        .mockResolvedValueOnce(connection) // 1. getConnection
        .mockResolvedValueOnce(['room1', 'room2']) // 2. getSocketRooms (removeFromAllRooms)
        // Para cada sala em removeFromAllRooms -> leaveRoom
        .mockResolvedValueOnce({
          roomId: 'room1',
          connections: ['socket123', 'socket456'],
        }) // 3. getRoom(room1) em leaveRoom
        .mockResolvedValueOnce(['room1', 'room2']) // 4. getSocketRooms(socket123) em removeSocketRoom
        .mockResolvedValueOnce({
          roomId: 'room2',
          connections: ['socket123'],
        }) // 5. getRoom(room2) em leaveRoom
        .mockResolvedValueOnce(['room2']) // 6. getSocketRooms(socket123) em removeSocketRoom
        .mockResolvedValueOnce(['socket123', 'socket456']); // 7. getUserSockets(1) em removeUserSocket

      redisService.setex.mockResolvedValue();
      redisService.del.mockResolvedValue();

      // Act
      await service.removeConnection(socketId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('socket:socket123');
    });

    it('deve remover conexão sem usuário', async () => {
      // Arrange
      const socketId = 'socket456';
      const connection: SocketConnection = {
        socketId,
        userId: undefined,
        connectionTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get
        .mockResolvedValueOnce(connection)
        .mockResolvedValueOnce([]); // getSocketRooms - sem salas

      redisService.del.mockResolvedValue();

      // Act
      await service.removeConnection(socketId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('socket:socket456');
    });

    it('deve funcionar quando conexão não existe', async () => {
      // Arrange
      const socketId = 'nonexistent';
      redisService.get.mockResolvedValue(null);
      redisService.del.mockResolvedValue();

      // Act
      await service.removeConnection(socketId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('socket:nonexistent');
    });
  });

  describe('getConnection', () => {
    it('deve retornar dados da conexão quando existe', async () => {
      // Arrange
      const socketId = 'socket123';
      const expectedConnection: SocketConnection = {
        socketId,
        userId: 1,
        connectionTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get.mockResolvedValue(expectedConnection);

      // Act
      const result = await service.getConnection(socketId);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith('socket:socket123');
      expect(result).toEqual(expectedConnection);
    });

    it('deve retornar null quando conexão não existe', async () => {
      // Arrange
      const socketId = 'nonexistent';
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.getConnection(socketId);

      // Assert
      expect(result).toBeNull();
    });

    it('deve retornar null quando conexão é undefined', async () => {
      // Arrange
      const socketId = 'undefined';
      redisService.get.mockResolvedValue(undefined);

      // Act
      const result = await service.getConnection(socketId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateActivity', () => {
    it('deve atualizar última atividade da conexão', async () => {
      // Arrange
      const socketId = 'socket123';
      const connection: SocketConnection = {
        socketId,
        userId: 1,
        connectionTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get.mockResolvedValue(connection);
      redisService.setex.mockResolvedValue();

      // Act
      await service.updateActivity(socketId);

      // Assert
      expect(redisService.setex).toHaveBeenCalledWith(
        'socket:socket123',
        86400,
        {
          ...connection,
          lastActivity: 1640995200000,
        },
      );
    });

    it('deve não fazer nada quando conexão não existe', async () => {
      // Arrange
      const socketId = 'nonexistent';
      redisService.get.mockResolvedValue(null);

      // Act
      await service.updateActivity(socketId);

      // Assert
      expect(redisService.setex).not.toHaveBeenCalled();
    });
  });

  describe('getUserConnections', () => {
    it('deve retornar todas as conexões de um usuário', async () => {
      // Arrange
      const userId = 1;
      const socketIds = ['socket1', 'socket2'];
      const connection1: SocketConnection = {
        socketId: 'socket1',
        userId: 1,
        connectionTime: 1640995100000,
        lastActivity: 1640995150000,
      };
      const connection2: SocketConnection = {
        socketId: 'socket2',
        userId: 1,
        connectionTime: 1640995120000,
        lastActivity: 1640995180000,
      };

      redisService.get
        .mockResolvedValueOnce(socketIds) // getUserSockets
        .mockResolvedValueOnce(connection1) // getConnection socket1
        .mockResolvedValueOnce(connection2); // getConnection socket2

      // Act
      const result = await service.getUserConnections(userId);

      // Assert
      expect(result).toEqual([connection1, connection2]);
    });

    it('deve filtrar conexões inválidas', async () => {
      // Arrange
      const userId = 1;
      const socketIds = ['socket1', 'invalid-socket'];
      const connection1: SocketConnection = {
        socketId: 'socket1',
        userId: 1,
        connectionTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get
        .mockResolvedValueOnce(socketIds)
        .mockResolvedValueOnce(connection1)
        .mockResolvedValueOnce(null); // invalid-socket

      // Act
      const result = await service.getUserConnections(userId);

      // Assert
      expect(result).toEqual([connection1]);
    });

    it('deve retornar array vazio quando usuário não tem conexões', async () => {
      // Arrange
      const userId = 1;
      redisService.get.mockResolvedValue([]);

      // Act
      const result = await service.getUserConnections(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('joinRoom', () => {
    it('deve adicionar socket a nova sala', async () => {
      // Arrange
      const socketId = 'socket123';
      const roomId = 'room1';

      redisService.get
        .mockResolvedValueOnce(null) // getRoom - sala não existe
        .mockResolvedValueOnce([]); // getSocketRooms

      redisService.setex.mockResolvedValue();

      // Act
      await service.joinRoom(socketId, roomId);

      // Assert
      const expectedRoom: SocketRoom = {
        roomId: 'room1',
        connections: ['socket123'],
      };

      expect(redisService.setex).toHaveBeenCalledWith(
        'room:room1',
        86400,
        expectedRoom,
      );
    });

    it('deve adicionar socket a sala existente', async () => {
      // Arrange
      const socketId = 'socket123';
      const roomId = 'room1';
      const existingRoom: SocketRoom = {
        roomId: 'room1',
        connections: ['socket456'],
      };

      redisService.get
        .mockResolvedValueOnce(existingRoom) // getRoom
        .mockResolvedValueOnce(['room2']); // getSocketRooms

      redisService.setex.mockResolvedValue();

      // Act
      await service.joinRoom(socketId, roomId);

      // Assert
      expect(redisService.setex).toHaveBeenCalledWith('room:room1', 86400, {
        roomId: 'room1',
        connections: ['socket456', 'socket123'],
      });
    });

    it('deve não duplicar socket na mesma sala', async () => {
      // Arrange
      const socketId = 'socket123';
      const roomId = 'room1';
      const existingRoom: SocketRoom = {
        roomId: 'room1',
        connections: ['socket123', 'socket456'],
      };

      redisService.get
        .mockResolvedValueOnce(existingRoom) // getRoom
        .mockResolvedValueOnce(['room1']); // getSocketRooms

      redisService.setex.mockResolvedValue();

      // Act
      await service.joinRoom(socketId, roomId);

      // Assert
      // Como o socket já está na sala, não deve chamar setex para atualizar a sala nem as salas do socket
      expect(redisService.setex).not.toHaveBeenCalled();
    });
  });

  describe('leaveRoom', () => {
    it('deve remover socket de sala com outras conexões', async () => {
      // Arrange
      const socketId = 'socket123';
      const roomId = 'room1';
      const room: SocketRoom = {
        roomId: 'room1',
        connections: ['socket123', 'socket456'],
      };

      redisService.get
        .mockResolvedValueOnce(room) // getRoom
        .mockResolvedValueOnce(['room1', 'room2']); // getSocketRooms

      redisService.setex.mockResolvedValue();

      // Act
      await service.leaveRoom(socketId, roomId);

      // Assert
      expect(redisService.setex).toHaveBeenCalledWith('room:room1', 86400, {
        roomId: 'room1',
        connections: ['socket456'],
      });
    });

    it('deve deletar sala quando remove última conexão', async () => {
      // Arrange
      const socketId = 'socket123';
      const roomId = 'room1';
      const room: SocketRoom = {
        roomId: 'room1',
        connections: ['socket123'],
      };

      redisService.get
        .mockResolvedValueOnce(room)
        .mockResolvedValueOnce(['room1']);

      redisService.del.mockResolvedValue();
      redisService.setex.mockResolvedValue();

      // Act
      await service.leaveRoom(socketId, roomId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('room:room1');
    });

    it('deve funcionar quando sala não existe', async () => {
      // Arrange
      const socketId = 'socket123';
      const roomId = 'nonexistent';

      redisService.get
        .mockResolvedValueOnce(null) // getRoom
        .mockResolvedValueOnce(['room2']); // getSocketRooms

      redisService.setex.mockResolvedValue();

      // Act
      await service.leaveRoom(socketId, roomId);

      // Assert
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });

  describe('getRoom', () => {
    it('deve retornar dados da sala quando existe', async () => {
      // Arrange
      const roomId = 'room1';
      const expectedRoom: SocketRoom = {
        roomId: 'room1',
        connections: ['socket1', 'socket2'],
        metadata: { type: 'public' },
      };

      redisService.get.mockResolvedValue(expectedRoom);

      // Act
      const result = await service.getRoom(roomId);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith('room:room1');
      expect(result).toEqual(expectedRoom);
    });

    it('deve retornar null quando sala não existe', async () => {
      // Arrange
      const roomId = 'nonexistent';
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.getRoom(roomId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getRoomConnections', () => {
    it('deve retornar todas as conexões de uma sala', async () => {
      // Arrange
      const roomId = 'room1';
      const room: SocketRoom = {
        roomId: 'room1',
        connections: ['socket1', 'socket2'],
      };
      const connection1: SocketConnection = {
        socketId: 'socket1',
        userId: 1,
        connectionTime: 1640995100000,
        lastActivity: 1640995150000,
      };
      const connection2: SocketConnection = {
        socketId: 'socket2',
        userId: 2,
        connectionTime: 1640995120000,
        lastActivity: 1640995180000,
      };

      redisService.get
        .mockResolvedValueOnce(room) // getRoom
        .mockResolvedValueOnce(connection1) // getConnection socket1
        .mockResolvedValueOnce(connection2); // getConnection socket2

      // Act
      const result = await service.getRoomConnections(roomId);

      // Assert
      expect(result).toEqual([connection1, connection2]);
    });

    it('deve retornar array vazio quando sala não existe', async () => {
      // Arrange
      const roomId = 'nonexistent';
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.getRoomConnections(roomId);

      // Assert
      expect(result).toEqual([]);
    });

    it('deve filtrar conexões inválidas', async () => {
      // Arrange
      const roomId = 'room1';
      const room: SocketRoom = {
        roomId: 'room1',
        connections: ['socket1', 'invalid-socket'],
      };
      const connection1: SocketConnection = {
        socketId: 'socket1',
        userId: 1,
        connectionTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get
        .mockResolvedValueOnce(room)
        .mockResolvedValueOnce(connection1)
        .mockResolvedValueOnce(null); // invalid-socket

      // Act
      const result = await service.getRoomConnections(roomId);

      // Assert
      expect(result).toEqual([connection1]);
    });
  });

  describe('getActiveConnectionsCount', () => {
    it('deve retornar 0 (implementação placeholder)', async () => {
      // Act
      const result = await service.getActiveConnectionsCount();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getActiveRooms', () => {
    it('deve retornar array vazio (implementação placeholder)', async () => {
      // Act
      const result = await service.getActiveRooms();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
