import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitConfig, RateLimitService } from './rate-limit.service';
import { RedisService } from './redis.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    redisService = module.get(RedisService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    const config: RateLimitConfig = {
      windowMs: 60000, // 1 minuto
      maxRequests: 5,
    };

    it('deve permitir requisição quando dentro do limite', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(2); // contagem atual

      // Act
      const result = await service.checkRateLimit('user123', config);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(2); // 5 - 3 = 2
      expect(result.totalRequests).toBe(3);
      expect(mockRedisService.setex).toHaveBeenCalledWith(
        'rate_limit:user123:count',
        60,
        3,
      );
    });

    it('deve bloquear requisição quando exceder o limite', async () => {
      // Arrange
      const now = Date.now();
      mockRedisService.get
        .mockResolvedValueOnce(5) // contagem atual no limite
        .mockResolvedValueOnce(now - 30000); // timestamp mais antigo

      // Act
      const result = await service.checkRateLimit('user123', config);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.remainingRequests).toBe(0);
      expect(result.totalRequests).toBe(5);
      expect(result.resetTime).toBe(now - 30000 + 60000);
    });

    it('deve resetar limite quando janela de tempo expirar', async () => {
      // Arrange
      const now = Date.now();
      mockRedisService.get
        .mockResolvedValueOnce(5) // contagem no limite
        .mockResolvedValueOnce(now - 70000); // timestamp antigo (expirado)

      // Act
      const result = await service.checkRateLimit('user123', config);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(4); // 5 - 1 = 4
      expect(result.totalRequests).toBe(1);
      expect(mockRedisService.del).toHaveBeenCalledTimes(3); // reset chamado
    });

    it('deve usar keyGenerator personalizado quando fornecido', async () => {
      // Arrange
      const customConfig: RateLimitConfig = {
        ...config,
        keyGenerator: (id) => `custom:${id}`,
      };
      mockRedisService.get.mockResolvedValue(0);

      // Act
      await service.checkRateLimit('user123', customConfig);

      // Assert
      expect(mockRedisService.get).toHaveBeenCalledWith('custom:user123:count');
    });

    it('deve definir timestamp da primeira requisição', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(0); // primeira requisição

      // Act
      await service.checkRateLimit('user123', config);

      // Assert
      expect(mockRedisService.setex).toHaveBeenCalledWith(
        'rate_limit:user123:oldest',
        60,
        expect.any(Number),
      );
    });
  });

  describe('checkLoginRateLimit', () => {
    it('deve usar configuração específica para login', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(2);

      // Act
      const result = await service.checkLoginRateLimit('user123');

      // Assert
      expect(result.allowed).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'rate_limit:login:user123:count',
      );
      expect(mockRedisService.setex).toHaveBeenCalledWith(
        'rate_limit:login:user123:count',
        900, // 15 minutos
        expect.any(Number),
      );
    });

    it('deve bloquear após 5 tentativas de login', async () => {
      // Arrange
      const now = Date.now();
      mockRedisService.get
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(now - 60000);

      // Act
      const result = await service.checkLoginRateLimit('user123');

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.totalRequests).toBe(5);
    });
  });

  describe('checkApiRateLimit', () => {
    it('deve usar configuração específica para API', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(50);

      // Act
      const result = await service.checkApiRateLimit('user123');

      // Assert
      expect(result.allowed).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'rate_limit:api:user123:count',
      );
      expect(mockRedisService.setex).toHaveBeenCalledWith(
        'rate_limit:api:user123:count',
        60, // 1 minuto
        51,
      );
    });
  });

  describe('checkCreateRateLimit', () => {
    it('deve usar configuração específica para criação', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(5);

      // Act
      const result = await service.checkCreateRateLimit('user123');

      // Assert
      expect(result.allowed).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'rate_limit:create:user123:count',
      );
    });
  });

  describe('checkSocketRateLimit', () => {
    it('deve usar configuração específica para WebSocket', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(3);

      // Act
      const result = await service.checkSocketRateLimit('user123');

      // Assert
      expect(result.allowed).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'rate_limit:socket:user123:count',
      );
      expect(mockRedisService.setex).toHaveBeenCalledWith(
        'rate_limit:socket:user123:count',
        300, // 5 minutos
        4,
      );
    });
  });

  describe('resetRateLimit', () => {
    it('deve limpar todas as chaves relacionadas', async () => {
      // Act
      await service.resetRateLimit('rate_limit:user123');

      // Assert
      expect(mockRedisService.del).toHaveBeenCalledTimes(3);
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'rate_limit:user123:count',
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'rate_limit:user123:oldest',
      );
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'rate_limit:user123:requests',
      );
    });
  });

  describe('resetRateLimitByType', () => {
    it('deve resetar rate limit por tipo específico', async () => {
      // Arrange
      const spy = jest.spyOn(service, 'resetRateLimit');

      // Act
      await service.resetRateLimitByType('user123', 'login');

      // Assert
      expect(spy).toHaveBeenCalledWith('rate_limit:login:user123');
    });
  });

  describe('incrementFailedAttempts', () => {
    it('deve incrementar contador de tentativas falhadas', async () => {
      // Arrange
      mockRedisService.incr.mockResolvedValue(3);

      // Act
      const result = await service.incrementFailedAttempts('user123');

      // Assert
      expect(result).toBe(3);
      expect(mockRedisService.incr).toHaveBeenCalledWith(
        'rate_limit:failed:user123',
      );
    });

    it('deve definir TTL apenas na primeira tentativa', async () => {
      // Arrange
      mockRedisService.incr.mockResolvedValue(1);

      // Act
      await service.incrementFailedAttempts('user123', 3600000);

      // Assert
      expect(mockRedisService.setex).toHaveBeenCalledWith(
        'rate_limit:failed:user123',
        3600,
        1,
      );
    });

    it('não deve definir TTL em tentativas subsequentes', async () => {
      // Arrange
      mockRedisService.incr.mockResolvedValue(3);

      // Act
      await service.incrementFailedAttempts('user123');

      // Assert
      expect(mockRedisService.setex).not.toHaveBeenCalled();
    });
  });

  describe('getFailedAttempts', () => {
    it('deve retornar número de tentativas falhadas', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(4);

      // Act
      const result = await service.getFailedAttempts('user123');

      // Assert
      expect(result).toBe(4);
      expect(mockRedisService.get).toHaveBeenCalledWith(
        'rate_limit:failed:user123',
      );
    });

    it('deve retornar 0 quando não há tentativas registradas', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(null);

      // Act
      const result = await service.getFailedAttempts('user123');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('clearFailedAttempts', () => {
    it('deve limpar tentativas falhadas', async () => {
      // Act
      await service.clearFailedAttempts('user123');

      // Assert
      expect(mockRedisService.del).toHaveBeenCalledWith(
        'rate_limit:failed:user123',
      );
    });
  });

  describe('isTemporarilyBlocked', () => {
    it('deve retornar true quando exceder máximo de tentativas', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(6);

      // Act
      const result = await service.isTemporarilyBlocked('user123', 5);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false quando dentro do limite', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(3);

      // Act
      const result = await service.isTemporarilyBlocked('user123', 5);

      // Assert
      expect(result).toBe(false);
    });

    it('deve usar padrão de 5 tentativas quando não especificado', async () => {
      // Arrange
      mockRedisService.get.mockResolvedValue(5);

      // Act
      const result = await service.isTemporarilyBlocked('user123');

      // Assert
      expect(result).toBe(true);
    });
  });
});
