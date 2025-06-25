import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { of } from 'rxjs';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  CacheInterceptor,
  CacheResult,
} from './cache.interceptor';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let cacheManager: jest.Mocked<Cache>;
  let reflector: jest.Mocked<Reflector>;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInterceptor,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);
    cacheManager = module.get(CACHE_MANAGER);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CacheResult decorator', () => {
    it('deve definir metadados corretos no método', () => {
      // Arrange
      const target = {};
      const propertyName = 'testMethod';
      const descriptor = { value: function () {} };

      // Act
      CacheResult('test-key', 600)(target, propertyName, descriptor);

      // Assert
      expect(Reflect.getMetadata(CACHE_KEY_METADATA, descriptor.value)).toBe(
        'test-key',
      );
      expect(Reflect.getMetadata(CACHE_TTL_METADATA, descriptor.value)).toBe(
        600,
      );
    });

    it('deve usar TTL padrão de 300 segundos quando não especificado', () => {
      // Arrange
      const target = {};
      const propertyName = 'testMethod';
      const descriptor = { value: function () {} };

      // Act
      CacheResult('test-key')(target, propertyName, descriptor);

      // Assert
      expect(Reflect.getMetadata(CACHE_TTL_METADATA, descriptor.value)).toBe(
        300,
      );
    });
  });

  describe('intercept', () => {
    let mockCallHandler: jest.Mocked<CallHandler>;

    beforeEach(() => {
      mockCallHandler = {
        handle: jest.fn(),
      };
    });

    it('deve pular cache quando não há metadados de cache', async () => {
      // Arrange
      const mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({})),
        })),
      } as any;

      reflector.get.mockReturnValue(undefined);
      const expectedResult = { data: 'test' };
      mockCallHandler.handle.mockReturnValue(of(expectedResult));

      // Act
      const result = await interceptor.intercept(mockContext, mockCallHandler);

      // Assert
      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(cacheManager.get).not.toHaveBeenCalled();

      result.subscribe((data) => {
        expect(data).toEqual(expectedResult);
      });
    });

    it('deve retornar dados do cache quando disponível', async () => {
      // Arrange
      const mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            params: {},
            query: {},
            user: null,
          })),
        })),
      } as any;

      const cacheKey = 'test-key';
      const cachedData = { data: 'cached' };

      reflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      cacheManager.get.mockResolvedValue(cachedData);

      // Act
      const result = await interceptor.intercept(mockContext, mockCallHandler);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
      expect(mockCallHandler.handle).not.toHaveBeenCalled();

      result.subscribe((data) => {
        expect(data).toEqual(cachedData);
      });
    });

    it('deve executar método e cachear resultado quando não está no cache', async () => {
      // Arrange
      const mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            params: {},
            query: {},
            user: null,
          })),
        })),
      } as any;

      const cacheKey = 'test-key';
      const methodResult = { data: 'fresh' };
      const ttl = 600;

      reflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(ttl);

      cacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(methodResult));

      // Act
      const result = await interceptor.intercept(mockContext, mockCallHandler);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('test-key');
      expect(mockCallHandler.handle).toHaveBeenCalled();

      // Aguardar o observable completar
      await new Promise<void>((resolve) => {
        result.subscribe({
          complete: () => {
            // Verificar se o resultado foi cacheado após o observable completar
            expect(cacheManager.set).toHaveBeenCalledWith(
              'test-key',
              methodResult,
              600000,
            );
            resolve();
          },
        });
      });
    });

    it('deve construir chave de cache com parâmetros da rota', async () => {
      // Arrange
      const mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            params: { id: '123', type: 'profile' },
            query: {},
            user: null,
          })),
        })),
      } as any;

      const cacheKey = 'user-data';

      reflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      cacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      // Act
      await interceptor.intercept(mockContext, mockCallHandler);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith('user-data:123:profile');
    });

    it('deve construir chave de cache com query parameters ordenados', async () => {
      // Arrange
      const mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            params: {},
            query: {
              limit: '10',
              page: '1',
              search: 'test',
              order: 'desc',
            },
            user: null,
          })),
        })),
      } as any;

      const cacheKey = 'search-results';

      reflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      cacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      // Act
      await interceptor.intercept(mockContext, mockCallHandler);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(
        'search-results:limit:10:order:desc:page:1:search:test',
      );
    });

    it('deve incluir ID do usuário na chave de cache quando disponível', async () => {
      // Arrange
      const mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            params: { action: 'profile' },
            query: {},
            user: { id: 456 },
          })),
        })),
      } as any;

      const cacheKey = 'user-specific';

      reflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      cacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      // Act
      await interceptor.intercept(mockContext, mockCallHandler);

      // Assert
      expect(cacheManager.get).toHaveBeenCalledWith(
        'user-specific:profile:user:456',
      );
    });

    it('não deve cachear quando resultado é falsy', async () => {
      // Arrange
      const mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            params: {},
            query: {},
            user: null,
          })),
        })),
      } as any;

      const cacheKey = 'test-key';

      reflector.get.mockReturnValueOnce(cacheKey).mockReturnValueOnce(300);

      cacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(null));

      // Act
      const result = await interceptor.intercept(mockContext, mockCallHandler);

      // Assert
      await new Promise<void>((resolve) => {
        result.subscribe({
          next: () => {},
          complete: () => {
            expect(cacheManager.set).not.toHaveBeenCalled();
            resolve();
          },
        });
      });
    });

    it('deve converter TTL de segundos para milissegundos no cache', async () => {
      // Arrange
      const mockContext = {
        getHandler: jest.fn(),
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            params: {},
            query: {},
            user: null,
          })),
        })),
      } as any;

      const cacheKey = 'test-key';
      const ttlInSeconds = 120;
      const methodResult = { data: 'test' };

      reflector.get
        .mockReturnValueOnce(cacheKey)
        .mockReturnValueOnce(ttlInSeconds);

      cacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(methodResult));

      // Act
      const result = await interceptor.intercept(mockContext, mockCallHandler);

      // Assert
      await new Promise<void>((resolve) => {
        result.subscribe({
          next: () => {},
          complete: () => {
            expect(cacheManager.set).toHaveBeenCalledWith(
              'test-key',
              methodResult,
              120000, // 120 segundos * 1000 = 120000 milissegundos
            );
            resolve();
          },
        });
      });
    });
  });

  describe('buildCacheKey', () => {
    it('deve criar chave simples quando não há parâmetros', () => {
      // Arrange
      const baseKey = 'simple-key';
      const request = { params: {}, query: {}, user: null };

      // Act
      const result = (interceptor as any).buildCacheKey(baseKey, request);

      // Assert
      expect(result).toBe('simple-key');
    });

    it('deve criar chave com múltiplos parâmetros ordenados', () => {
      // Arrange
      const baseKey = 'data';
      const request = {
        params: { id: '1', type: 'user' },
        query: { z: 'last', a: 'first', m: 'middle' },
        user: { id: 999 },
      };

      // Act
      const result = (interceptor as any).buildCacheKey(baseKey, request);

      // Assert
      expect(result).toBe('data:1:user:a:first:m:middle:z:last:user:999');
    });
  });
});
