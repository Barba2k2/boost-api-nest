import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let cacheManager: jest.Mocked<Cache>;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('deve definir um valor no cache', async () => {
      // Arrange
      const key = 'test-key';
      const value = { data: 'test-value' };
      const ttl = 300;

      // Act
      await service.set(key, value, ttl);

      // Assert
      expect(cacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('deve definir um valor sem TTL', async () => {
      // Arrange
      const key = 'test-key';
      const value = 'simple-value';

      // Act
      await service.set(key, value);

      // Assert
      expect(cacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('deve funcionar com diferentes tipos de valores', async () => {
      // Arrange & Act & Assert
      await service.set('string-key', 'string-value');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'string-key',
        'string-value',
        undefined,
      );

      await service.set('number-key', 123);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'number-key',
        123,
        undefined,
      );

      await service.set('object-key', { prop: 'value' });
      expect(cacheManager.set).toHaveBeenCalledWith(
        'object-key',
        { prop: 'value' },
        undefined,
      );

      await service.set('array-key', [1, 2, 3]);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'array-key',
        [1, 2, 3],
        undefined,
      );
    });
  });

  describe('get', () => {
    it('deve retornar valor do cache quando existe', async () => {
      // Arrange
      const key = 'existing-key';
      const expectedValue = { data: 'cached-data' };
      cacheManager.get.mockResolvedValue(expectedValue);

      // Act
      const result = await service.get(key);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(expectedValue);
    });

    it('deve retornar undefined quando valor é null', async () => {
      // Arrange
      const key = 'null-key';
      cacheManager.get.mockResolvedValue(null);

      // Act
      const result = await service.get(key);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBeUndefined();
    });

    it('deve retornar undefined quando chave não existe', async () => {
      // Arrange
      const key = 'nonexistent-key';
      cacheManager.get.mockResolvedValue(undefined);

      // Act
      const result = await service.get(key);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBeUndefined();
    });

    it('deve funcionar com tipagem genérica', async () => {
      // Arrange
      interface TestData {
        id: number;
        name: string;
      }
      const key = 'typed-key';
      const expectedValue: TestData = { id: 1, name: 'test' };
      cacheManager.get.mockResolvedValue(expectedValue);

      // Act
      const result = await service.get<TestData>(key);

      // Assert
      expect(result).toEqual(expectedValue);
      expect(result?.id).toBe(1);
      expect(result?.name).toBe('test');
    });
  });

  describe('del', () => {
    it('deve remover uma chave do cache', async () => {
      // Arrange
      const key = 'key-to-delete';

      // Act
      await service.del(key);

      // Assert
      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });

    it('deve funcionar mesmo se chave não existir', async () => {
      // Arrange
      const key = 'nonexistent-key';

      // Act
      await service.del(key);

      // Assert
      expect(cacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('reset', () => {
    it('deve limpar todo o cache quando reset está disponível', async () => {
      // Arrange
      const mockCacheWithReset = {
        ...mockCacheManager,
        reset: jest.fn().mockResolvedValue(undefined),
      };

      const moduleWithReset: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          {
            provide: CACHE_MANAGER,
            useValue: mockCacheWithReset,
          },
        ],
      }).compile();

      const serviceWithReset = moduleWithReset.get<RedisService>(RedisService);

      // Act
      await serviceWithReset.reset();

      // Assert
      expect(mockCacheWithReset.reset).toHaveBeenCalled();
    });

    it('deve funcionar silenciosamente quando reset não está disponível', async () => {
      // Arrange
      const mockCacheWithoutReset = {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        // sem método reset
      };

      const moduleWithoutReset: TestingModule = await Test.createTestingModule({
        providers: [
          RedisService,
          {
            provide: CACHE_MANAGER,
            useValue: mockCacheWithoutReset,
          },
        ],
      }).compile();

      const serviceWithoutReset =
        moduleWithoutReset.get<RedisService>(RedisService);

      // Act & Assert - não deve lançar erro
      await expect(serviceWithoutReset.reset()).resolves.not.toThrow();
    });
  });

  describe('has', () => {
    it('deve retornar true quando chave existe', async () => {
      // Arrange
      const key = 'existing-key';
      cacheManager.get.mockResolvedValue('some-value');

      // Act
      const result = await service.has(key);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('deve retornar false quando chave não existe', async () => {
      // Arrange
      const key = 'nonexistent-key';
      cacheManager.get.mockResolvedValue(undefined);

      // Act
      const result = await service.has(key);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBe(false);
    });

    it('deve retornar false quando valor é null', async () => {
      // Arrange
      const key = 'null-key';
      cacheManager.get.mockResolvedValue(null);

      // Act
      const result = await service.has(key);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('setex', () => {
    it('deve definir valor com expiração em segundos', async () => {
      // Arrange
      const key = 'expiring-key';
      const value = 'expiring-value';
      const seconds = 60;

      // Act
      await service.setex(key, seconds, value);

      // Assert
      expect(cacheManager.set).toHaveBeenCalledWith(key, value, 60000); // 60 segundos * 1000 = 60000 ms
    });

    it('deve converter diferentes valores de segundos corretamente', async () => {
      // Arrange & Act & Assert
      await service.setex('key1', 1, 'value1');
      expect(cacheManager.set).toHaveBeenCalledWith('key1', 'value1', 1000);

      await service.setex('key2', 300, 'value2');
      expect(cacheManager.set).toHaveBeenCalledWith('key2', 'value2', 300000);

      await service.setex('key3', 3600, 'value3');
      expect(cacheManager.set).toHaveBeenCalledWith('key3', 'value3', 3600000);
    });
  });

  describe('incr', () => {
    it('deve incrementar valor existente', async () => {
      // Arrange
      const key = 'counter-key';
      cacheManager.get.mockResolvedValue(5);

      // Act
      const result = await service.incr(key);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(cacheManager.set).toHaveBeenCalledWith(key, 6, undefined);
      expect(result).toBe(6);
    });

    it('deve iniciar em 1 quando chave não existe', async () => {
      // Arrange
      const key = 'new-counter';
      cacheManager.get.mockResolvedValue(undefined);

      // Act
      const result = await service.incr(key);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(cacheManager.set).toHaveBeenCalledWith(key, 1, undefined);
      expect(result).toBe(1);
    });

    it('deve tratar valor null como 0', async () => {
      // Arrange
      const key = 'null-counter';
      cacheManager.get.mockResolvedValue(null);

      // Act
      const result = await service.incr(key);

      // Assert
      expect(cacheManager.set).toHaveBeenCalledWith(key, 1, undefined);
      expect(result).toBe(1);
    });
  });

  describe('mset', () => {
    it('deve definir múltiplas chaves sem TTL', async () => {
      // Arrange
      const keyValuePairs = {
        key1: 'value1',
        key2: { data: 'value2' },
        key3: 123,
      };

      // Act
      await service.mset(keyValuePairs);

      // Assert
      expect(cacheManager.set).toHaveBeenCalledTimes(3);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'key1',
        'value1',
        undefined,
      );
      expect(cacheManager.set).toHaveBeenCalledWith(
        'key2',
        { data: 'value2' },
        undefined,
      );
      expect(cacheManager.set).toHaveBeenCalledWith('key3', 123, undefined);
    });

    it('deve definir múltiplas chaves com TTL', async () => {
      // Arrange
      const keyValuePairs = {
        key1: 'value1',
        key2: 'value2',
      };
      const ttl = 300;

      // Act
      await service.mset(keyValuePairs, ttl);

      // Assert
      expect(cacheManager.set).toHaveBeenCalledTimes(2);
      expect(cacheManager.set).toHaveBeenCalledWith('key1', 'value1', ttl);
      expect(cacheManager.set).toHaveBeenCalledWith('key2', 'value2', ttl);
    });

    it('deve funcionar com objeto vazio', async () => {
      // Arrange
      const keyValuePairs = {};

      // Act
      await service.mset(keyValuePairs);

      // Assert
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('mget', () => {
    it('deve obter múltiplas chaves', async () => {
      // Arrange
      const keys = ['key1', 'key2', 'key3'];
      cacheManager.get
        .mockResolvedValueOnce('value1')
        .mockResolvedValueOnce({ data: 'value2' })
        .mockResolvedValueOnce(null);

      // Act
      const result = await service.mget(keys);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledTimes(3);
      expect(cacheManager.get).toHaveBeenCalledWith('key1');
      expect(cacheManager.get).toHaveBeenCalledWith('key2');
      expect(cacheManager.get).toHaveBeenCalledWith('key3');
      expect(result).toEqual(['value1', { data: 'value2' }, undefined]);
    });

    it('deve funcionar com array vazio', async () => {
      // Arrange
      const keys: string[] = [];

      // Act
      const result = await service.mget(keys);

      // Assert
      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('deve funcionar com tipagem genérica', async () => {
      // Arrange
      interface TestData {
        id: number;
      }
      const keys = ['key1', 'key2'];
      cacheManager.get
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 });

      // Act
      const result = await service.mget<TestData>(keys);

      // Assert
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });
});
