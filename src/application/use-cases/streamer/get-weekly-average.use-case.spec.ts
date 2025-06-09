import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
  WeeklyAverageData,
} from '@application/ports/repositories/score.repository.interface';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GetWeeklyAverageCommand,
  GetWeeklyAverageUseCase,
} from './get-weekly-average.use-case';

describe('GetWeeklyAverageUseCase', () => {
  let useCase: GetWeeklyAverageUseCase;
  let scoreRepository: jest.Mocked<IScoreRepository>;

  const mockScoreRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByStreamerId: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    getTotalPointsByStreamerId: jest.fn(),
    getDailyPointsByStreamerAndDate: jest.fn(),
    getScoreReportByPeriod: jest.fn(),
    getScoresByDateGroupedByHour: jest.fn(),
    getWeeklyRanking: jest.fn(),
    getWeeklyAverage: jest.fn(),
    getDailyScoresForWeek: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWeeklyAverageUseCase,
        {
          provide: SCORE_REPOSITORY_TOKEN,
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetWeeklyAverageUseCase>(GetWeeklyAverageUseCase);
    scoreRepository = module.get(SCORE_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: GetWeeklyAverageCommand = {
      streamerId: 1,
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
    };

    const mockWeeklyAverageData: WeeklyAverageData = {
      streamerId: 1,
      nickname: 'teststreamer',
      totalPoints: 350,
      daysWithPoints: 5,
      averagePoints: 70.0,
      dailyBreakdown: {
        monday: 80,
        tuesday: 70,
        wednesday: 60,
        thursday: 90,
        friday: 50,
      },
    };

    it('deve retornar média semanal do streamer com sucesso', async () => {
      // Arrange
      scoreRepository.getWeeklyAverage.mockResolvedValue(mockWeeklyAverageData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(scoreRepository.getWeeklyAverage).toHaveBeenCalledWith(
        validCommand.streamerId,
        validCommand.startDate,
        validCommand.endDate,
      );

      expect(result).toEqual({
        streamerId: validCommand.streamerId,
        nickname: mockWeeklyAverageData.nickname,
        totalPoints: mockWeeklyAverageData.totalPoints,
        daysWithPoints: mockWeeklyAverageData.daysWithPoints,
        averagePoints: mockWeeklyAverageData.averagePoints,
        dailyBreakdown: mockWeeklyAverageData.dailyBreakdown,
        startDate: validCommand.startDate,
        endDate: validCommand.endDate,
      });
    });

    it('deve lançar NotFoundException quando streamer não tem dados', async () => {
      // Arrange
      scoreRepository.getWeeklyAverage.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        `Streamer com ID ${validCommand.streamerId} não encontrado`,
      );

      expect(scoreRepository.getWeeklyAverage).toHaveBeenCalledWith(
        validCommand.streamerId,
        validCommand.startDate,
        validCommand.endDate,
      );
    });

    it('deve lançar erro quando data de início é posterior à data de fim', async () => {
      // Arrange
      const invalidCommand: GetWeeklyAverageCommand = {
        streamerId: 1,
        startDate: new Date('2024-01-21T00:00:00Z'),
        endDate: new Date('2024-01-15T00:00:00Z'),
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(
        'Data de início não pode ser posterior à data de fim',
      );

      expect(scoreRepository.getWeeklyAverage).not.toHaveBeenCalled();
    });

    it('deve retornar dados corretos para streamer com poucos dias', async () => {
      // Arrange
      const fewDaysData: WeeklyAverageData = {
        streamerId: 1,
        nickname: 'newstreamer',
        totalPoints: 100,
        daysWithPoints: 2,
        averagePoints: 50.0,
        dailyBreakdown: {
          monday: 60,
          friday: 40,
        },
      };

      scoreRepository.getWeeklyAverage.mockResolvedValue(fewDaysData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.daysWithPoints).toBe(2);
      expect(result.averagePoints).toBe(50.0);
      expect(Object.keys(result.dailyBreakdown)).toHaveLength(2);
    });

    it('deve retornar dados para todos os dias da semana', async () => {
      // Arrange
      const fullWeekData: WeeklyAverageData = {
        streamerId: 1,
        nickname: 'activestreamer',
        totalPoints: 700,
        daysWithPoints: 7,
        averagePoints: 100.0,
        dailyBreakdown: {
          monday: 100,
          tuesday: 100,
          wednesday: 100,
          thursday: 100,
          friday: 100,
          saturday: 100,
          sunday: 100,
        },
      };

      scoreRepository.getWeeklyAverage.mockResolvedValue(fullWeekData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.daysWithPoints).toBe(7);
      expect(Object.keys(result.dailyBreakdown)).toHaveLength(7);
      expect(result.averagePoints).toBe(100.0);
    });

    it('deve calcular média corretamente com pontos decimais', async () => {
      // Arrange
      const decimalData: WeeklyAverageData = {
        streamerId: 1,
        nickname: 'decimal-streamer',
        totalPoints: 100,
        daysWithPoints: 3,
        averagePoints: 33.33,
        dailyBreakdown: {
          monday: 34,
          tuesday: 33,
          wednesday: 33,
        },
      };

      scoreRepository.getWeeklyAverage.mockResolvedValue(decimalData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.averagePoints).toBe(33.33);
    });

    it('deve propagar erros do repositório', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      scoreRepository.getWeeklyAverage.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('deve funcionar com diferentes períodos de tempo', async () => {
      // Arrange
      const customPeriodCommand: GetWeeklyAverageCommand = {
        streamerId: 1,
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-01-31T23:59:59Z'), // Um mês
      };

      scoreRepository.getWeeklyAverage.mockResolvedValue(mockWeeklyAverageData);

      // Act
      const result = await useCase.execute(customPeriodCommand);

      // Assert
      expect(scoreRepository.getWeeklyAverage).toHaveBeenCalledWith(
        customPeriodCommand.streamerId,
        customPeriodCommand.startDate,
        customPeriodCommand.endDate,
      );

      expect(result.startDate).toEqual(customPeriodCommand.startDate);
      expect(result.endDate).toEqual(customPeriodCommand.endDate);
    });
  });
});
