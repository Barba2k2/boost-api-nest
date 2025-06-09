import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthService } from './redis-health.service';
import { RedisService } from './redis.service';

describe('RedisHealthService', () => {
  let service: RedisHealthService;
  let redisService: jest.Mocked<RedisService>;
  let logger: jest.Mocked<Logger>;

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
        RedisHealthService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RedisHealthService>(RedisHealthService);
    redisService = module.get(RedisService);

    // Mock do logger
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    // Substituir o logger interno
    (service as any).logger = logger;

    // Mock do Date.now para testes determinísticos
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('checkHealth', () => {
    it('deve retornar status healthy quando Redis funciona corretamente', async () => {
      // Arrange
      const testValue = { timestamp: 1640995200000, test: true };
      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(testValue);
      redisService.del.mockResolvedValue();

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        'health:check',
        testValue,
        5,
      );
      expect(redisService.get).toHaveBeenCalledWith('health:check');
      expect(redisService.del).toHaveBeenCalledWith('health:check');
      expect(result).toEqual({
        status: 'healthy',
        message: 'Redis is working correctly',
      });
      expect(logger.log).toHaveBeenCalledWith('Redis health check passed');
    });

    it('deve retornar status unhealthy quando set falha', async () => {
      // Arrange
      const error = new Error('Connection failed');
      redisService.set.mockRejectedValue(error);

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Redis error: Connection failed',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Redis health check failed',
        error,
      );
      expect(redisService.get).not.toHaveBeenCalled();
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('deve retornar status unhealthy quando get falha', async () => {
      // Arrange
      const testValue = { timestamp: 1640995200000, test: true };
      const error = new Error('Read failed');
      redisService.set.mockResolvedValue();
      redisService.get.mockRejectedValue(error);

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        'health:check',
        testValue,
        5,
      );
      expect(redisService.get).toHaveBeenCalledWith('health:check');
      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Redis error: Read failed',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Redis health check failed',
        error,
      );
    });

    it('deve retornar status unhealthy quando dados não conferem', async () => {
      // Arrange
      const testValue = { timestamp: 1640995200000, test: true };
      const corruptedValue = { timestamp: 1640995200000, test: false }; // dados diferentes
      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(corruptedValue);

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        'health:check',
        testValue,
        5,
      );
      expect(redisService.get).toHaveBeenCalledWith('health:check');
      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Redis error: Data integrity check failed',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Redis health check failed',
        expect.any(Error),
      );
    });

    it('deve retornar status unhealthy quando get retorna null', async () => {
      // Arrange
      const testValue = { timestamp: 1640995200000, test: true };
      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        'health:check',
        testValue,
        5,
      );
      expect(redisService.get).toHaveBeenCalledWith('health:check');
      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Redis error: Data integrity check failed',
      });
    });

    it('deve retornar status unhealthy quando get retorna undefined', async () => {
      // Arrange
      const testValue = { timestamp: 1640995200000, test: true };
      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(undefined);

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Redis error: Data integrity check failed',
      });
    });

    it('deve tentar limpar chave de teste mesmo quando dados conferem', async () => {
      // Arrange
      const testValue = { timestamp: 1640995200000, test: true };
      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(testValue);
      redisService.del.mockResolvedValue();

      // Act
      await service.checkHealth();

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('health:check');
    });

    it('deve continuar funcionando mesmo se delete falhar', async () => {
      // Arrange
      const testValue = { timestamp: 1640995200000, test: true };
      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(testValue);
      redisService.del.mockRejectedValue(new Error('Delete failed'));

      // Act
      const result = await service.checkHealth();

      // Assert
      expect(result).toEqual({
        status: 'unhealthy',
        message: 'Redis error: Delete failed',
      });
    });
  });

  describe('performanceTest', () => {
    beforeEach(() => {
      // Mock sequence for Date.now calls
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1640995200000) // testData timestamp
        .mockReturnValueOnce(1640995200010) // writeStart
        .mockReturnValueOnce(1640995200020) // após write (10ms)
        .mockReturnValueOnce(1640995200025) // readStart
        .mockReturnValueOnce(1640995200030); // após read (5ms)
    });

    it('deve executar teste de performance com sucesso', async () => {
      // Arrange
      const expectedTestData = {
        data: 'test data for performance measurement',
        timestamp: 1640995200000,
        nested: {
          array: [1, 2, 3, 4, 5],
          object: { key: 'value' },
        },
      };

      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(expectedTestData);
      redisService.del.mockResolvedValue();

      // Act
      const result = await service.performanceTest();

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        'performance:test',
        expectedTestData,
        10,
      );
      expect(redisService.get).toHaveBeenCalledWith('performance:test');
      expect(redisService.del).toHaveBeenCalledWith('performance:test');

      expect(result).toEqual({
        status: 'success',
        writeTime: 10, // 1640995200020 - 1640995200010
        readTime: 5, // 1640995200030 - 1640995200025
        totalTime: 15, // 10 + 5
      });

      expect(logger.log).toHaveBeenCalledWith(
        'Redis performance test - Write: 10ms, Read: 5ms, Total: 15ms',
      );
    });

    it('deve lançar erro quando set falha', async () => {
      // Arrange
      const error = new Error('Set operation failed');
      redisService.set.mockRejectedValue(error);

      // Act & Assert
      await expect(service.performanceTest()).rejects.toThrow(
        'Set operation failed',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Redis performance test failed',
        error,
      );
      expect(redisService.get).not.toHaveBeenCalled();
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando get falha', async () => {
      // Arrange
      const error = new Error('Get operation failed');
      redisService.set.mockResolvedValue();
      redisService.get.mockRejectedValue(error);

      // Act & Assert
      await expect(service.performanceTest()).rejects.toThrow(
        'Get operation failed',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Redis performance test failed',
        error,
      );
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando del falha', async () => {
      // Arrange
      const testData = {
        data: 'test data for performance measurement',
        timestamp: 1640995200000,
        nested: {
          array: [1, 2, 3, 4, 5],
          object: { key: 'value' },
        },
      };
      const error = new Error('Delete operation failed');
      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(testData);
      redisService.del.mockRejectedValue(error);

      // Act & Assert
      await expect(service.performanceTest()).rejects.toThrow(
        'Delete operation failed',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'Redis performance test failed',
        error,
      );
    });

    it('deve medir tempos diferentes para operações diferentes', async () => {
      // Arrange - Mock com tempos diferentes
      // Resetando os mocks do beforeEach
      jest.spyOn(Date, 'now').mockRestore();
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1640995200000) // testData timestamp
        .mockReturnValueOnce(1640995200010) // writeStart
        .mockReturnValueOnce(1640995200050) // após write (40ms)
        .mockReturnValueOnce(1640995200055) // readStart
        .mockReturnValueOnce(1640995200065); // após read (10ms)

      const testData = {
        data: 'test data for performance measurement',
        timestamp: 1640995200000,
        nested: {
          array: [1, 2, 3, 4, 5],
          object: { key: 'value' },
        },
      };

      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue(testData);
      redisService.del.mockResolvedValue();

      // Act
      const result = await service.performanceTest();

      // Assert
      expect(result).toEqual({
        status: 'success',
        writeTime: 40, // 1640995200050 - 1640995200010
        readTime: 10, // 1640995200065 - 1640995200055
        totalTime: 50, // 40 + 10
      });
    });

    it('deve usar dados de teste com estrutura complexa', async () => {
      // Arrange
      redisService.set.mockResolvedValue();
      redisService.get.mockResolvedValue({});
      redisService.del.mockResolvedValue();

      // Act
      await service.performanceTest();

      // Assert
      const expectedTestData = expect.objectContaining({
        data: 'test data for performance measurement',
        timestamp: expect.any(Number),
        nested: expect.objectContaining({
          array: [1, 2, 3, 4, 5],
          object: { key: 'value' },
        }),
      });

      expect(redisService.set).toHaveBeenCalledWith(
        'performance:test',
        expectedTestData,
        10,
      );
    });
  });
});
