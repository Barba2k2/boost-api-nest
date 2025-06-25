import { GetAdminPeriodSummaryUseCase } from '@application/use-cases/streamer/get-admin-period-summary.use-case';
import { GetDailyScoresWeekUseCase } from '@application/use-cases/streamer/get-daily-scores-week.use-case';
import { GetWeeklyAverageUseCase } from '@application/use-cases/streamer/get-weekly-average.use-case';
import { GetWeeklyRankingUseCase } from '@application/use-cases/streamer/get-weekly-ranking.use-case';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DailyScoresWeekResponseDto } from '@presentation/dto/streamer/daily-scores-week-response.dto';
import { WeeklyAverageResponseDto } from '@presentation/dto/streamer/weekly-average-response.dto';
import { WeeklyRankingResponseDto } from '@presentation/dto/streamer/weekly-ranking-response.dto';
import { AdminScoreController } from './admin-score.controller';

describe('AdminScoreController', () => {
  let controller: AdminScoreController;
  let getWeeklyRankingUseCase: jest.Mocked<GetWeeklyRankingUseCase>;
  let getWeeklyAverageUseCase: jest.Mocked<GetWeeklyAverageUseCase>;
  let getDailyScoresWeekUseCase: jest.Mocked<GetDailyScoresWeekUseCase>;
  let getAdminPeriodSummaryUseCase: jest.Mocked<GetAdminPeriodSummaryUseCase>;

  const mockGetWeeklyRankingUseCase = {
    execute: jest.fn(),
  };

  const mockGetWeeklyAverageUseCase = {
    execute: jest.fn(),
  };

  const mockGetDailyScoresWeekUseCase = {
    execute: jest.fn(),
  };

  const mockGetAdminPeriodSummaryUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminScoreController],
      providers: [
        {
          provide: GetWeeklyRankingUseCase,
          useValue: mockGetWeeklyRankingUseCase,
        },
        {
          provide: GetWeeklyAverageUseCase,
          useValue: mockGetWeeklyAverageUseCase,
        },
        {
          provide: GetDailyScoresWeekUseCase,
          useValue: mockGetDailyScoresWeekUseCase,
        },
        {
          provide: GetAdminPeriodSummaryUseCase,
          useValue: mockGetAdminPeriodSummaryUseCase,
        },
      ],
    }).compile();

    controller = module.get<AdminScoreController>(AdminScoreController);
    getWeeklyRankingUseCase = module.get(GetWeeklyRankingUseCase);
    getWeeklyAverageUseCase = module.get(GetWeeklyAverageUseCase);
    getDailyScoresWeekUseCase = module.get(GetDailyScoresWeekUseCase);
    getAdminPeriodSummaryUseCase = module.get(GetAdminPeriodSummaryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeeklyRanking', () => {
    const validStartDate = '2025-01-06'; // Segunda-feira
    const validEndDate = '2025-01-11'; // Sábado

    const mockRankingData = {
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-01-11'),
      ranking: [
        {
          streamerId: 1,
          nickname: 'streamer1',
          totalPoints: 100,
          position: 1,
        },
        {
          streamerId: 2,
          nickname: 'streamer2',
          totalPoints: 80,
          position: 2,
        },
      ],
      metadata: {
        totalStreamers: 2,
        totalPoints: 180,
      },
    };

    it('deve retornar ranking semanal com sucesso', async () => {
      // Arrange
      mockGetWeeklyRankingUseCase.execute.mockResolvedValue(mockRankingData);

      // Act
      const result = await controller.getWeeklyRanking(
        validStartDate,
        validEndDate,
      );

      // Assert
      expect(getWeeklyRankingUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2025-01-06T00:00:00.000Z'),
        endDate: new Date('2025-01-11T23:59:59.999Z'),
      });
      expect(result).toBeInstanceOf(WeeklyRankingResponseDto);
    });

    it('deve propagar erro de validação de data', async () => {
      // Arrange
      const invalidStartDate = 'invalid-date';

      // Act & Assert
      await expect(
        controller.getWeeklyRanking(invalidStartDate, validEndDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });

    it('deve propagar erro do use case', async () => {
      // Arrange
      const error = new Error('Erro interno');
      mockGetWeeklyRankingUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getWeeklyRanking(validStartDate, validEndDate),
      ).rejects.toThrow('Erro interno');
    });
  });

  describe('getWeeklyAverage', () => {
    const streamerId = 1;
    const validStartDate = '2025-01-06';
    const validEndDate = '2025-01-11';

    const mockAverageData = {
      streamerId: 1,
      streamerNickname: 'streamer1',
      period: {
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-11'),
      },
      averagePoints: 85.5,
      totalPoints: 427,
      totalDays: 5,
      bestDay: {
        date: new Date('2025-01-08'),
        points: 120,
      },
      worstDay: {
        date: new Date('2025-01-07'),
        points: 60,
      },
    };

    it('deve retornar média semanal com sucesso', async () => {
      // Arrange
      mockGetWeeklyAverageUseCase.execute.mockResolvedValue(mockAverageData);

      // Act
      const result = await controller.getWeeklyAverage(
        streamerId,
        validStartDate,
        validEndDate,
      );

      // Assert
      expect(getWeeklyAverageUseCase.execute).toHaveBeenCalledWith({
        streamerId,
        startDate: new Date('2025-01-06T00:00:00.000Z'),
        endDate: new Date('2025-01-11T23:59:59.999Z'),
      });
      expect(result).toBeInstanceOf(WeeklyAverageResponseDto);
    });

    it('deve propagar NotFoundException quando streamer não existe', async () => {
      // Arrange
      const error = new NotFoundException('Streamer não encontrado');
      mockGetWeeklyAverageUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getWeeklyAverage(999, validStartDate, validEndDate),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve validar ID do streamer como número', async () => {
      // Arrange
      mockGetWeeklyAverageUseCase.execute.mockResolvedValue(mockAverageData);

      // Act
      await controller.getWeeklyAverage(
        streamerId,
        validStartDate,
        validEndDate,
      );

      // Assert
      expect(getWeeklyAverageUseCase.execute).toHaveBeenCalledWith({
        streamerId: expect.any(Number),
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
    });
  });

  describe('getDailyWeek', () => {
    const validStartDate = '2025-01-06';
    const validEndDate = '2025-01-11';

    const mockDailyData = {
      period: {
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-11'),
      },
      dailyScores: [
        {
          date: new Date('2025-01-06'),
          streamers: [
            {
              streamerId: 1,
              streamerNickname: 'streamer1',
              points: 95,
            },
            {
              streamerId: 2,
              streamerNickname: 'streamer2',
              points: 88,
            },
          ],
          totalPoints: 183,
        },
        {
          date: new Date('2025-01-07'),
          streamers: [
            {
              streamerId: 1,
              streamerNickname: 'streamer1',
              points: 102,
            },
          ],
          totalPoints: 102,
        },
      ],
      summary: {
        totalDays: 6,
        totalPoints: 285,
        averagePointsPerDay: 47.5,
      },
    };

    it('deve retornar pontos diários da semana com sucesso', async () => {
      // Arrange
      mockGetDailyScoresWeekUseCase.execute.mockResolvedValue(mockDailyData);

      // Act
      const result = await controller.getDailyWeek(
        validStartDate,
        validEndDate,
      );

      // Assert
      expect(getDailyScoresWeekUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2025-01-06T00:00:00.000Z'),
        endDate: new Date('2025-01-11T23:59:59.999Z'),
      });
      expect(result).toBeInstanceOf(DailyScoresWeekResponseDto);
    });

    it('deve propagar erro de validação de período', async () => {
      // Arrange
      const endDateBeforeStart = '2025-01-05';

      // Act & Assert
      await expect(
        controller.getDailyWeek(validStartDate, endDateBeforeStart),
      ).rejects.toThrow('Data de início não pode ser posterior à data de fim.');
    });
  });

  describe('getPeriodSummary', () => {
    const validStartDate = '2025-01-06';
    const validEndDate = '2025-01-11';

    const mockSummaryData = {
      period: {
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-11'),
      },
      ranking: [
        {
          streamerId: 1,
          streamerNickname: 'streamer1',
          totalPoints: 450,
          averagePoints: 90,
          position: 1,
        },
      ],
      statistics: {
        totalStreamers: 5,
        totalPoints: 1250,
        averagePointsPerStreamer: 250,
        bestPerformance: {
          streamerId: 1,
          points: 450,
          date: new Date('2025-01-08'),
        },
        participation: {
          activeDays: 6,
          totalPossibleDays: 6,
          participationRate: 100,
        },
      },
      trends: {
        pointsGrowth: 15.5,
        participationGrowth: -2.1,
      },
    };

    it('deve retornar resumo do período com sucesso', async () => {
      // Arrange
      mockGetAdminPeriodSummaryUseCase.execute.mockResolvedValue(
        mockSummaryData,
      );

      // Act
      const result = await controller.getPeriodSummary(
        validStartDate,
        validEndDate,
      );

      // Assert
      expect(getAdminPeriodSummaryUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2025-01-06T00:00:00.000Z'),
        endDate: new Date('2025-01-11T23:59:59.999Z'),
      });
      expect(result).toBe(mockSummaryData);
    });

    it('deve validar formato das datas', async () => {
      // Arrange
      const invalidDateFormat = '01/06/2025';

      // Act & Assert
      await expect(
        controller.getPeriodSummary(invalidDateFormat, validEndDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });

    it('deve propagar erro quando período é muito longo', async () => {
      // Arrange
      const error = new BadRequestException('Período muito extenso');
      mockGetAdminPeriodSummaryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getPeriodSummary(validStartDate, validEndDate),
      ).rejects.toThrow('Período muito extenso');
    });
  });

  describe('integração com DateValidationUtil', () => {
    it('deve usar DateValidationUtil para validar datas em todos os endpoints', async () => {
      // Esta integração é testada implicitamente nos testes acima
      // O DateValidationUtil lança BadRequestException para datas inválidas

      const invalidDate = 'invalid';
      const validDate = '2025-01-06';

      // Test para cada endpoint
      await expect(
        controller.getWeeklyRanking(invalidDate, validDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');

      await expect(
        controller.getWeeklyAverage(1, invalidDate, validDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');

      await expect(
        controller.getDailyWeek(invalidDate, validDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');

      await expect(
        controller.getPeriodSummary(invalidDate, validDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });
  });
});
