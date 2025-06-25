import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
} from '@application/ports/repositories/score.repository.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { GetDailyPointsUseCase } from './get-daily-points.use-case';

describe('GetDailyPointsUseCase', () => {
  let useCase: GetDailyPointsUseCase;
  let scoreRepository: jest.Mocked<IScoreRepository>;

  const mockScoreRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByStreamerId: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    getTotalPointsByStreamerId: jest.fn(),
    getDailyPointsByStreamerAndDate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDailyPointsUseCase,
        {
          provide: SCORE_REPOSITORY_TOKEN,
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetDailyPointsUseCase>(GetDailyPointsUseCase);
    scoreRepository = module.get(SCORE_REPOSITORY_TOKEN);

    // Mock Date para tornar testes previsíveis
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-04T15:30:00Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('execute', () => {
    it('deve retornar pontos diários para data específica', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        date: new Date('2025-01-04T10:00:00Z'),
      };

      mockScoreRepository.getDailyPointsByStreamerAndDate.mockResolvedValue(12);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(
        scoreRepository.getDailyPointsByStreamerAndDate,
      ).toHaveBeenCalledWith(1, new Date('2025-01-04T10:00:00Z'));

      expect(result).toEqual({
        streamerId: 1,
        date: new Date('2025-01-04T10:00:00Z'),
        currentPoints: 12,
        remainingPoints: 228,
        dailyLimit: 240,
      });
    });

    it('deve usar data atual quando não informada', async () => {
      // Arrange
      const command = {
        streamerId: 1,
      };

      mockScoreRepository.getDailyPointsByStreamerAndDate.mockResolvedValue(80);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(
        scoreRepository.getDailyPointsByStreamerAndDate,
      ).toHaveBeenCalledWith(1, new Date('2025-01-04T15:30:00Z'));

      expect(result).toEqual({
        streamerId: 1,
        date: new Date('2025-01-04T15:30:00Z'),
        currentPoints: 80,
        remainingPoints: 160,
        dailyLimit: 240,
      });
    });

    it('deve retornar 0 pontos restantes quando limite atingido', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        date: new Date('2025-01-04T10:00:00Z'),
      };

      mockScoreRepository.getDailyPointsByStreamerAndDate.mockResolvedValue(
        240,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result).toEqual({
        streamerId: 1,
        date: new Date('2025-01-04T10:00:00Z'),
        currentPoints: 240,
        remainingPoints: 0,
        dailyLimit: 240,
      });
    });

    it('deve retornar 0 pontos restantes quando limite excedido (caso teórico)', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        date: new Date('2025-01-04T10:00:00Z'),
      };

      // Caso teórico onde há mais de 240 pontos (não deveria acontecer com a validação)
      mockScoreRepository.getDailyPointsByStreamerAndDate.mockResolvedValue(
        250,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result).toEqual({
        streamerId: 1,
        date: new Date('2025-01-04T10:00:00Z'),
        currentPoints: 250,
        remainingPoints: 0, // Math.max(0, 240 - 250) = 0
        dailyLimit: 240,
      });
    });

    it('deve retornar resultado correto quando não há pontos no dia', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        date: new Date('2025-01-04T10:00:00Z'),
      };

      mockScoreRepository.getDailyPointsByStreamerAndDate.mockResolvedValue(0);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result).toEqual({
        streamerId: 1,
        date: new Date('2025-01-04T10:00:00Z'),
        currentPoints: 0,
        remainingPoints: 240,
        dailyLimit: 240,
      });
    });
  });
});
