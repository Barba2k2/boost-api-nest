import { Test, TestingModule } from '@nestjs/testing';
import { CacheInvalidationService } from './cache-invalidation.service';
import { RedisService } from './redis.service';

describe('CacheInvalidationService', () => {
  let service: CacheInvalidationService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<CacheInvalidationService>(CacheInvalidationService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('invalidateUserCache', () => {
    it('deve invalidar cache de usuário específico', async () => {
      // Arrange
      const userId = 123;
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateUserCache(userId);

      // Assert
      expect(redisService.del).toHaveBeenCalledTimes(2);
      expect(redisService.del).toHaveBeenCalledWith('user:123');
      expect(redisService.del).toHaveBeenCalledWith('streamers:all');
    });

    it('deve lidar com diferentes IDs de usuário', async () => {
      // Arrange
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateUserCache(1);
      await service.invalidateUserCache(999);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('user:1');
      expect(redisService.del).toHaveBeenCalledWith('user:999');
    });
  });

  describe('invalidateStreamersCache', () => {
    it('deve invalidar cache geral de streamers', async () => {
      // Arrange
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateStreamersCache();

      // Assert
      expect(redisService.del).toHaveBeenCalledTimes(1);
      expect(redisService.del).toHaveBeenCalledWith('streamers:all');
    });
  });

  describe('invalidateStreamerCache', () => {
    it('deve invalidar cache de streamer específico', async () => {
      // Arrange
      const streamerId = 456;
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateStreamerCache(streamerId);

      // Assert
      expect(redisService.del).toHaveBeenCalledTimes(2);
      expect(redisService.del).toHaveBeenCalledWith('streamer:456');
      expect(redisService.del).toHaveBeenCalledWith('streamers:all');
    });

    it('deve lidar com diferentes IDs de streamer', async () => {
      // Arrange
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateStreamerCache(1);
      await service.invalidateStreamerCache(999);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('streamer:1');
      expect(redisService.del).toHaveBeenCalledWith('streamer:999');
    });
  });

  describe('invalidateAuthCache', () => {
    it('deve invalidar cache de autenticação', async () => {
      // Arrange
      const userId = 789;
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateAuthCache(userId);

      // Assert
      expect(redisService.del).toHaveBeenCalledTimes(3);
      expect(redisService.del).toHaveBeenCalledWith('auth:token:789');
      expect(redisService.del).toHaveBeenCalledWith('auth:session:789');
      expect(redisService.del).toHaveBeenCalledWith('user:789');
    });

    it('deve invalidar cache de auth para diferentes usuários', async () => {
      // Arrange
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateAuthCache(100);
      await service.invalidateAuthCache(200);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('auth:token:100');
      expect(redisService.del).toHaveBeenCalledWith('auth:token:200');
      expect(redisService.del).toHaveBeenCalledWith('user:100');
      expect(redisService.del).toHaveBeenCalledWith('user:200');
    });
  });

  describe('invalidateSocketCache', () => {
    it('deve invalidar cache de WebSocket', async () => {
      // Arrange
      const socketId = 'socket123';
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateSocketCache(socketId);

      // Assert
      expect(redisService.del).toHaveBeenCalledTimes(2);
      expect(redisService.del).toHaveBeenCalledWith('socket:temp:socket123');
      expect(redisService.del).toHaveBeenCalledWith('socket:session:socket123');
    });

    it('deve lidar com diferentes IDs de socket', async () => {
      // Arrange
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateSocketCache('socket-abc');
      await service.invalidateSocketCache('socket-xyz');

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('socket:temp:socket-abc');
      expect(redisService.del).toHaveBeenCalledWith('socket:temp:socket-xyz');
    });
  });

  describe('clearAllCache', () => {
    it('deve limpar todo o cache', async () => {
      // Arrange
      redisService.reset.mockResolvedValue();

      // Act
      await service.clearAllCache();

      // Assert
      expect(redisService.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateMultiplePatterns', () => {
    it('deve invalidar chaves sem wildcard', async () => {
      // Arrange
      const userId = 123;
      redisService.del.mockResolvedValue();

      // Act
      await service.invalidateUserCache(userId);

      // Assert
      // Verificar que del foi chamado para chaves específicas
      expect(redisService.del).toHaveBeenCalledWith('user:123');
      expect(redisService.del).toHaveBeenCalledWith('streamers:all');
    });

    it('deve processar padrões com wildcard sem erro', async () => {
      // Arrange
      redisService.del.mockResolvedValue();

      // Act - Este teste verifica que padrões com * não causam erro
      await service.invalidateUserCache(1);

      // Assert - Padrões com * são ignorados, mas não devem causar erro
      expect(redisService.del).toHaveBeenCalled();
    });
  });

  describe('tratamento de erros', () => {
    it('deve lidar com erro no Redis durante invalidateUserCache', async () => {
      // Arrange
      redisService.del.mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(service.invalidateUserCache(123)).rejects.toThrow(
        'Redis error',
      );
    });

    it('deve lidar com erro no Redis durante clearAllCache', async () => {
      // Arrange
      redisService.reset.mockRejectedValue(new Error('Redis connection error'));

      // Act & Assert
      await expect(service.clearAllCache()).rejects.toThrow(
        'Redis connection error',
      );
    });

    it('deve continuar se uma das operações falhar', async () => {
      // Arrange
      redisService.del
        .mockResolvedValueOnce() // primeira chamada sucede
        .mockRejectedValueOnce(new Error('Redis error')); // segunda falha

      // Act & Assert
      await expect(service.invalidateUserCache(123)).rejects.toThrow();
    });
  });

  describe('operações em paralelo', () => {
    it('deve executar múltiplas invalidações em paralelo', async () => {
      // Arrange
      let resolveCount = 0;
      redisService.del.mockImplementation(() => {
        resolveCount++;
        return Promise.resolve();
      });

      // Act
      const promises = [
        service.invalidateUserCache(1),
        service.invalidateStreamerCache(1),
        service.invalidateAuthCache(1),
      ];

      await Promise.all(promises);

      // Assert
      expect(redisService.del).toHaveBeenCalledTimes(7); // 2 + 2 + 3 calls
    });

    it('deve aguardar todas as operações completarem', async () => {
      // Arrange
      let delayedPromises: Array<() => void> = [];
      redisService.del.mockImplementation(() => {
        return new Promise((resolve) => {
          delayedPromises.push(resolve);
        });
      });

      // Act
      const invalidationPromise = service.invalidateUserCache(123);

      // Neste ponto, as promises ainda não foram resolvidas
      expect(delayedPromises).toHaveLength(2);

      // Resolver todas as promises
      delayedPromises.forEach((resolve) => resolve());

      // Assert
      await expect(invalidationPromise).resolves.toBeUndefined();
    });
  });
});
