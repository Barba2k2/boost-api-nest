import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { RateLimitService } from '../rate-limit.service';
import {
  RATE_LIMIT_METADATA,
  RateLimit,
  RateLimitInterceptor,
} from './rate-limit.interceptor';

describe('RateLimitInterceptor', () => {
  let interceptor: RateLimitInterceptor;
  let rateLimitService: jest.Mocked<RateLimitService>;
  let reflector: jest.Mocked<Reflector>;

  const mockRateLimitService = {
    checkLoginRateLimit: jest.fn(),
    checkApiRateLimit: jest.fn(),
    checkCreateRateLimit: jest.fn(),
    checkSocketRateLimit: jest.fn(),
    checkRateLimit: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
  };

  const mockRequest = {
    user: { id: 123 },
    headers: {},
    ip: '192.168.1.1',
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn(() => of('test-response')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitInterceptor,
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<RateLimitInterceptor>(RateLimitInterceptor);
    rateLimitService = module.get(RateLimitService);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('deve prosseguir sem rate limiting se não houver configuração', async () => {
      // Arrange
      reflector.get.mockReturnValue(null);

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(rateLimitService.checkLoginRateLimit).not.toHaveBeenCalled();
    });

    it('deve aplicar rate limiting de login com sucesso', async () => {
      // Arrange
      const loginConfig = { type: 'login', maxRequests: 5, windowMs: 60000 };
      reflector.get.mockReturnValue(loginConfig);

      const rateLimitResult = {
        allowed: true,
        remainingRequests: 4,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      };

      rateLimitService.checkLoginRateLimit.mockResolvedValue(rateLimitResult);

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      expect(rateLimitService.checkLoginRateLimit).toHaveBeenCalledWith(
        'user:123',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        5,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        4,
      );
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('deve bloquear requisição quando rate limit é excedido', async () => {
      // Arrange
      const loginConfig = { type: 'login', maxRequests: 5, windowMs: 60000 };
      reflector.get.mockReturnValue(loginConfig);

      const resetTime = Date.now() + 60000;
      const rateLimitResult = {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        totalRequests: 6,
      };

      rateLimitService.checkLoginRateLimit.mockResolvedValue(rateLimitResult);

      // Act & Assert
      await expect(
        interceptor.intercept(mockExecutionContext, mockCallHandler),
      ).rejects.toThrow(HttpException);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 60);
    });

    it('deve usar configuração de API rate limiting', async () => {
      // Arrange
      const apiConfig = { type: 'api', maxRequests: 100, windowMs: 60000 };
      reflector.get.mockReturnValue(apiConfig);

      const rateLimitResult = {
        allowed: true,
        remainingRequests: 99,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      };

      rateLimitService.checkApiRateLimit.mockResolvedValue(rateLimitResult);

      // Act
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(rateLimitService.checkApiRateLimit).toHaveBeenCalledWith(
        'user:123',
      );
    });

    it('deve usar configuração de create rate limiting', async () => {
      // Arrange
      const createConfig = { type: 'create', maxRequests: 10, windowMs: 60000 };
      reflector.get.mockReturnValue(createConfig);

      const rateLimitResult = {
        allowed: true,
        remainingRequests: 9,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      };

      rateLimitService.checkCreateRateLimit.mockResolvedValue(rateLimitResult);

      // Act
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(rateLimitService.checkCreateRateLimit).toHaveBeenCalledWith(
        'user:123',
      );
    });

    it('deve usar configuração de socket rate limiting', async () => {
      // Arrange
      const socketConfig = { type: 'socket', maxRequests: 50, windowMs: 60000 };
      reflector.get.mockReturnValue(socketConfig);

      const rateLimitResult = {
        allowed: true,
        remainingRequests: 49,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      };

      rateLimitService.checkSocketRateLimit.mockResolvedValue(rateLimitResult);

      // Act
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(rateLimitService.checkSocketRateLimit).toHaveBeenCalledWith(
        'user:123',
      );
    });

    it('deve usar configuração personalizada', async () => {
      // Arrange
      const customConfig = { maxRequests: 30, windowMs: 120000 };
      reflector.get.mockReturnValue(customConfig);

      const rateLimitResult = {
        allowed: true,
        remainingRequests: 29,
        resetTime: Date.now() + 120000,
        totalRequests: 1,
      };

      rateLimitService.checkRateLimit.mockResolvedValue(rateLimitResult);

      // Act
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(rateLimitService.checkRateLimit).toHaveBeenCalledWith('user:123', {
        windowMs: 120000,
        maxRequests: 30,
        keyGenerator: undefined,
      });
    });
  });

  describe('getIdentifier', () => {
    it('deve usar ID do usuário quando disponível', async () => {
      // Arrange
      const configWithUser = { type: 'api' };
      reflector.get.mockReturnValue(configWithUser);

      rateLimitService.checkApiRateLimit.mockResolvedValue({
        allowed: true,
        remainingRequests: 99,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      });

      // Act
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(rateLimitService.checkApiRateLimit).toHaveBeenCalledWith(
        'user:123',
      );
    });

    it('deve usar IP quando usuário não está disponível', async () => {
      // Arrange
      const mockContextWithoutUser = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
            ip: '192.168.1.100',
          }),
          getResponse: () => mockResponse,
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const configWithIP = { type: 'api' };
      reflector.get.mockReturnValue(configWithIP);

      rateLimitService.checkApiRateLimit.mockResolvedValue({
        allowed: true,
        remainingRequests: 99,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      });

      // Act
      await interceptor.intercept(mockContextWithoutUser, mockCallHandler);

      // Assert
      expect(rateLimitService.checkApiRateLimit).toHaveBeenCalledWith(
        'ip:192.168.1.100',
      );
    });

    it('deve usar x-forwarded-for header quando disponível', async () => {
      // Arrange
      const mockContextWithProxy = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-forwarded-for': '10.0.0.1, 10.0.0.2, 192.168.1.1',
            },
            ip: '192.168.1.1',
          }),
          getResponse: () => mockResponse,
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const configWithProxy = { type: 'api' };
      reflector.get.mockReturnValue(configWithProxy);

      rateLimitService.checkApiRateLimit.mockResolvedValue({
        allowed: true,
        remainingRequests: 99,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      });

      // Act
      await interceptor.intercept(mockContextWithProxy, mockCallHandler);

      // Assert
      expect(rateLimitService.checkApiRateLimit).toHaveBeenCalledWith(
        'ip:10.0.0.1',
      );
    });

    it('deve usar x-real-ip header quando x-forwarded-for não está disponível', async () => {
      // Arrange
      const mockContextWithRealIP = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-real-ip': '203.0.113.1',
            },
            ip: '192.168.1.1',
          }),
          getResponse: () => mockResponse,
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const config = { type: 'api' };
      reflector.get.mockReturnValue(config);

      rateLimitService.checkApiRateLimit.mockResolvedValue({
        allowed: true,
        remainingRequests: 99,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      });

      // Act
      await interceptor.intercept(mockContextWithRealIP, mockCallHandler);

      // Assert
      expect(rateLimitService.checkApiRateLimit).toHaveBeenCalledWith(
        'ip:203.0.113.1',
      );
    });
  });

  describe('headers', () => {
    it('deve definir todos os headers de rate limiting', async () => {
      // Arrange
      const config = { type: 'api', maxRequests: 100 };
      reflector.get.mockReturnValue(config);

      const resetTime = Date.now() + 60000;
      const rateLimitResult = {
        allowed: true,
        remainingRequests: 95,
        resetTime,
        totalRequests: 5,
      };

      rateLimitService.checkApiRateLimit.mockResolvedValue(rateLimitResult);

      // Act
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        100,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        95,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        new Date(resetTime).toISOString(),
      );
    });

    it('deve definir Retry-After header quando rate limit é excedido', async () => {
      // Arrange
      const config = { type: 'api', maxRequests: 100 };
      reflector.get.mockReturnValue(config);

      const resetTime = Date.now() + 30000; // 30 segundos
      const rateLimitResult = {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        totalRequests: 101,
      };

      rateLimitService.checkApiRateLimit.mockResolvedValue(rateLimitResult);

      // Act & Assert
      await expect(
        interceptor.intercept(mockExecutionContext, mockCallHandler),
      ).rejects.toThrow();

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 30);
    });
  });

  describe('RateLimit decorator', () => {
    it('deve definir metadata corretamente', () => {
      // Arrange
      const config = { type: 'login' as const, maxRequests: 5 };

      // Act
      class TestController {
        @RateLimit(config)
        testMethod() {
          return 'test';
        }
      }

      // Assert
      const metadata = Reflect.getMetadata(
        RATE_LIMIT_METADATA,
        TestController.prototype.testMethod,
      );
      expect(metadata).toEqual(config);
    });

    it('deve funcionar como decorator de classe', () => {
      // Arrange
      const config = { type: 'api' as const, maxRequests: 100 };

      // Act
      @RateLimit(config)
      class TestController {
        testMethod() {
          return 'test';
        }
      }

      // Assert
      const metadata = Reflect.getMetadata(RATE_LIMIT_METADATA, TestController);
      expect(metadata).toEqual(config);
    });
  });

  describe('tratamento de erros', () => {
    it('deve lançar HttpException com status 429 quando rate limit é excedido', async () => {
      // Arrange
      const config = { type: 'api', maxRequests: 100 };
      reflector.get.mockReturnValue(config);

      const resetTime = Date.now() + 60000;
      const rateLimitResult = {
        allowed: false,
        remainingRequests: 0,
        resetTime,
        totalRequests: 101,
      };

      rateLimitService.checkApiRateLimit.mockResolvedValue(rateLimitResult);

      // Act & Assert
      try {
        await interceptor.intercept(mockExecutionContext, mockCallHandler);
        fail('Esperava que uma exceção fosse lançada');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(error.getResponse()).toEqual({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Muitas requisições. Tente novamente mais tarde.',
          error: 'Too Many Requests',
          retryAfter: 60,
          resetTime: new Date(resetTime).toISOString(),
        });
      }
    });
  });
});
