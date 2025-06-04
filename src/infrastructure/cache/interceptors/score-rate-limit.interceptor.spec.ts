import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { RateLimitService } from '../rate-limit.service';
import { ScoreRateLimitInterceptor } from './score-rate-limit.interceptor';

describe('ScoreRateLimitInterceptor', () => {
  let interceptor: ScoreRateLimitInterceptor;
  let rateLimitService: jest.Mocked<RateLimitService>;

  const mockRateLimitService = {
    checkRateLimit: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        body: { streamerId: 1 },
      }),
    }),
  } as ExecutionContext;

  const mockCallHandler = {
    handle: () => of('test'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreRateLimitInterceptor,
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
      ],
    }).compile();

    interceptor = module.get<ScoreRateLimitInterceptor>(
      ScoreRateLimitInterceptor,
    );
    rateLimitService = module.get(RateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('deve permitir request quando não excede rate limit', async () => {
      // Arrange
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: true,
        remainingRequests: 0,
        resetTime: Date.now() + 360000,
        totalRequests: 1,
      });

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      expect(rateLimitService.checkRateLimit).toHaveBeenCalledWith(
        'score-creation-1',
        {
          windowMs: 6 * 60 * 1000,
          maxRequests: 1,
          keyGenerator: expect.any(Function),
        },
      );
      expect(result).toBeDefined();
    });

    it('deve bloquear request quando excede rate limit', async () => {
      // Arrange
      const resetTime = Date.now() + 300000; // 5 minutos
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remainingRequests: 0,
        resetTime,
        totalRequests: 1,
      });

      // Act & Assert
      await expect(
        interceptor.intercept(mockExecutionContext, mockCallHandler),
      ).rejects.toThrow(HttpException);

      await expect(
        interceptor.intercept(mockExecutionContext, mockCallHandler),
      ).rejects.toThrow('Limite de criação de score excedido');
    });

    it('deve lançar erro quando streamerId não está presente', async () => {
      // Arrange
      const mockContextWithoutStreamerId = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {},
          }),
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(
        interceptor.intercept(mockContextWithoutStreamerId, mockCallHandler),
      ).rejects.toThrow(HttpException);

      await expect(
        interceptor.intercept(mockContextWithoutStreamerId, mockCallHandler),
      ).rejects.toThrow('streamerId é obrigatório');
    });

    it('deve calcular corretamente o tempo restante em minutos', async () => {
      // Arrange
      const resetTime = Date.now() + 4 * 60 * 1000; // 4 minutos
      mockRateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remainingRequests: 0,
        resetTime,
        totalRequests: 1,
      });

      // Act & Assert
      try {
        await interceptor.intercept(mockExecutionContext, mockCallHandler);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(error.getResponse()).toMatchObject({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: expect.stringContaining('6 minutos'),
          details: {
            nextAllowedIn: '4 minuto(s)',
            streamerId: 1,
          },
        });
      }
    });
  });
});
