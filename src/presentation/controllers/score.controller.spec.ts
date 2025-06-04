import { CreateScoreUseCase } from '@application/use-cases/streamer/create-score.use-case';
import {
  DailyPointsResult,
  GetDailyPointsUseCase,
} from '@application/use-cases/streamer/get-daily-points.use-case';
import { Score } from '@domain/entities/score.entity';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DailyPointsResponseDto } from '@presentation/dto/streamer/daily-points-response.dto';
import { RateLimitService } from '../../infrastructure/cache/rate-limit.service';
import { ScoreController } from './score.controller';

describe('ScoreController', () => {
  let controller: ScoreController;
  let createScoreUseCase: jest.Mocked<CreateScoreUseCase>;
  let getDailyPointsUseCase: jest.Mocked<GetDailyPointsUseCase>;
  let rateLimitService: jest.Mocked<RateLimitService>;

  const mockCreateScoreUseCase = {
    execute: jest.fn(),
  };

  const mockGetDailyPointsUseCase = {
    execute: jest.fn(),
  };

  const mockRateLimitService = {
    checkRateLimit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScoreController],
      providers: [
        {
          provide: CreateScoreUseCase,
          useValue: mockCreateScoreUseCase,
        },
        {
          provide: GetDailyPointsUseCase,
          useValue: mockGetDailyPointsUseCase,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
      ],
    }).compile();

    controller = module.get<ScoreController>(ScoreController);
    createScoreUseCase = module.get(CreateScoreUseCase);
    getDailyPointsUseCase = module.get(GetDailyPointsUseCase);
    rateLimitService = module.get(RateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um score com sucesso', async () => {
      // Arrange
      const createScoreDto = {
        streamerId: 1,
        points: 5,
        reason: 'Completou stream de 2 horas',
      };

      const mockScore = new Score(
        1,
        1,
        5,
        'Completou stream de 2 horas',
        new Date('2025-01-04T15:30:00Z'),
      );

      mockCreateScoreUseCase.execute.mockResolvedValue(mockScore);

      // Act
      const result = await controller.create(createScoreDto);

      // Assert
      expect(createScoreUseCase.execute).toHaveBeenCalledWith({
        streamerId: 1,
        points: 5,
        reason: 'Completou stream de 2 horas',
      });

      expect(result).toEqual({
        id: 1,
        streamerId: 1,
        points: 5,
        reason: 'Completou stream de 2 horas',
        createdAt: new Date('2025-01-04T15:30:00Z'),
      });
    });

    it('deve propagar erro quando limite diário é excedido', async () => {
      // Arrange
      const createScoreDto = {
        streamerId: 1,
        points: 50,
        reason: 'Tentativa de pontuação',
      };

      const error = new BadRequestException(
        'Limite diário de 240 pontos excedido. Pontos atuais do dia: 200. Pontos restantes: 40.',
      );

      mockCreateScoreUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(createScoreDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(createScoreDto)).rejects.toThrow(
        'Limite diário de 240 pontos excedido. Pontos atuais do dia: 200. Pontos restantes: 40.',
      );
    });
  });

  describe('getDailyPoints', () => {
    it('deve retornar pontos diários sem data específica', async () => {
      // Arrange
      const streamerId = 1;
      const mockResult: DailyPointsResult = {
        streamerId,
        date: new Date('2024-01-04'),
        currentPoints: 120,
        dailyLimit: 240,
        remainingPoints: 120,
      };

      mockGetDailyPointsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getDailyPoints(streamerId);

      // Assert
      expect(mockGetDailyPointsUseCase.execute).toHaveBeenCalledWith({
        streamerId,
        date: undefined,
      });
      expect(result).toEqual(DailyPointsResponseDto.fromDomain(mockResult));
    });

    it('deve retornar pontos diários para data específica', async () => {
      // Arrange
      const streamerId = 1;
      const dateString = '2024-01-04';
      const mockResult: DailyPointsResult = {
        streamerId,
        date: new Date('2024-01-04'),
        currentPoints: 100,
        dailyLimit: 240,
        remainingPoints: 140,
      };

      mockGetDailyPointsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getDailyPoints(streamerId, dateString);

      // Assert
      expect(mockGetDailyPointsUseCase.execute).toHaveBeenCalledWith({
        streamerId,
        date: new Date('2024-01-04T00:00:00.000Z'),
      });
      expect(result).toEqual(DailyPointsResponseDto.fromDomain(mockResult));
    });

    it('deve lançar erro para data inválida', async () => {
      // Arrange
      const streamerId = 1;
      const invalidDate = 'invalid-date';

      // Act & Assert
      await expect(
        controller.getDailyPoints(streamerId, invalidDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });

    it('deve aceitar formato de data correto', async () => {
      // Arrange
      const streamerId = 1;
      const dateString = '2024-12-25';
      const mockResult: DailyPointsResult = {
        streamerId,
        date: new Date('2024-12-25'),
        currentPoints: 50,
        dailyLimit: 240,
        remainingPoints: 190,
      };

      mockGetDailyPointsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getDailyPoints(streamerId, dateString);

      // Assert
      expect(result.currentPoints).toBe(50);
      expect(result.remainingPoints).toBe(190);
    });
  });

  describe('getPublicDailyPoints', () => {
    it('deve retornar pontos diários sem data específica (endpoint público)', async () => {
      // Arrange
      const streamerId = 1;
      const mockResult: DailyPointsResult = {
        streamerId,
        date: new Date('2024-01-04'),
        currentPoints: 120,
        dailyLimit: 240,
        remainingPoints: 120,
      };

      mockGetDailyPointsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getPublicDailyPoints(streamerId);

      // Assert
      expect(mockGetDailyPointsUseCase.execute).toHaveBeenCalledWith({
        streamerId,
        date: undefined,
      });
      expect(result).toEqual(DailyPointsResponseDto.fromDomain(mockResult));
    });

    it('deve retornar pontos diários para data específica (endpoint público)', async () => {
      // Arrange
      const streamerId = 1;
      const dateString = '2024-01-04';
      const mockResult: DailyPointsResult = {
        streamerId,
        date: new Date('2024-01-04'),
        currentPoints: 80,
        dailyLimit: 240,
        remainingPoints: 160,
      };

      mockGetDailyPointsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getPublicDailyPoints(
        streamerId,
        dateString,
      );

      // Assert
      expect(mockGetDailyPointsUseCase.execute).toHaveBeenCalledWith({
        streamerId,
        date: new Date('2024-01-04T00:00:00.000Z'),
      });
      expect(result).toEqual(DailyPointsResponseDto.fromDomain(mockResult));
    });

    it('deve lançar erro para data inválida (endpoint público)', async () => {
      // Arrange
      const streamerId = 1;
      const invalidDate = 'invalid-date';

      // Act & Assert
      await expect(
        controller.getPublicDailyPoints(streamerId, invalidDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });

    it('deve funcionar independente de autenticação (endpoint público)', async () => {
      // Arrange
      const streamerId = 1;
      const mockResult: DailyPointsResult = {
        streamerId,
        date: new Date('2024-01-04'),
        currentPoints: 200,
        dailyLimit: 240,
        remainingPoints: 40,
      };

      mockGetDailyPointsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getPublicDailyPoints(streamerId);

      // Assert
      expect(result.currentPoints).toBe(200);
      expect(result.remainingPoints).toBe(40);
      // Este teste confirma que o método funciona sem verificações de autenticação
    });
  });
});
