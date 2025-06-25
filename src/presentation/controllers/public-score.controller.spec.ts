import { GetDailyPointsUseCase } from '@application/use-cases/streamer/get-daily-points.use-case';
import { GetDailyScoresWeekUseCase } from '@application/use-cases/streamer/get-daily-scores-week.use-case';
import { GetReportByNicknameUseCase } from '@application/use-cases/streamer/get-report-by-nickname.use-case';
import { GetScoreReportUseCase } from '@application/use-cases/streamer/get-score-report.use-case';
import { GetWeeklyAverageUseCase } from '@application/use-cases/streamer/get-weekly-average.use-case';
import { GetWeeklyRankingUseCase } from '@application/use-cases/streamer/get-weekly-ranking.use-case';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DailyPointsResponseDto } from '@presentation/dto/streamer/daily-points-response.dto';
import { WeeklyRankingResponseDto } from '@presentation/dto/streamer/weekly-ranking-response.dto';
import { PublicScoreController } from './public-score.controller';

describe('PublicScoreController', () => {
  let controller: PublicScoreController;
  let getDailyPointsUseCase: jest.Mocked<GetDailyPointsUseCase>;
  let getScoreReportUseCase: jest.Mocked<GetScoreReportUseCase>;
  let getWeeklyRankingUseCase: jest.Mocked<GetWeeklyRankingUseCase>;
  let getWeeklyAverageUseCase: jest.Mocked<GetWeeklyAverageUseCase>;
  let getDailyScoresWeekUseCase: jest.Mocked<GetDailyScoresWeekUseCase>;
  let getReportByNicknameUseCase: jest.Mocked<GetReportByNicknameUseCase>;

  const mockGetDailyPointsUseCase = {
    execute: jest.fn(),
  };

  const mockGetScoreReportUseCase = {
    execute: jest.fn(),
  };

  const mockGetWeeklyRankingUseCase = {
    execute: jest.fn(),
  };

  const mockGetWeeklyAverageUseCase = {
    execute: jest.fn(),
  };

  const mockGetDailyScoresWeekUseCase = {
    execute: jest.fn(),
  };

  const mockGetReportByNicknameUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicScoreController],
      providers: [
        {
          provide: GetDailyPointsUseCase,
          useValue: mockGetDailyPointsUseCase,
        },
        {
          provide: GetScoreReportUseCase,
          useValue: mockGetScoreReportUseCase,
        },
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
          provide: GetReportByNicknameUseCase,
          useValue: mockGetReportByNicknameUseCase,
        },
      ],
    }).compile();

    controller = module.get<PublicScoreController>(PublicScoreController);
    getDailyPointsUseCase = module.get(GetDailyPointsUseCase);
    getScoreReportUseCase = module.get(GetScoreReportUseCase);
    getWeeklyRankingUseCase = module.get(GetWeeklyRankingUseCase);
    getWeeklyAverageUseCase = module.get(GetWeeklyAverageUseCase);
    getDailyScoresWeekUseCase = module.get(GetDailyScoresWeekUseCase);
    getReportByNicknameUseCase = module.get(GetReportByNicknameUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyPoints', () => {
    const streamerId = 1;
    const validDate = '2025-01-13';

    const mockDailyPointsData = {
      streamerId: 1,
      streamerNickname: 'TestStreamer',
      date: new Date('2025-01-13'),
      points: 125,
      details: {
        basePoints: 100,
        bonusPoints: 25,
        penalties: 0,
      },
    };

    it('deve retornar pontos diários com sucesso', async () => {
      // Arrange
      mockGetDailyPointsUseCase.execute.mockResolvedValue(mockDailyPointsData);

      // Act
      const result = await controller.getDailyPoints(streamerId, validDate);

      // Assert
      expect(getDailyPointsUseCase.execute).toHaveBeenCalledWith({
        streamerId: 1,
        date: new Date('2025-01-13'),
      });
      expect(result).toBeInstanceOf(DailyPointsResponseDto);
    });

    it('deve funcionar sem data (usar data atual)', async () => {
      // Arrange
      mockGetDailyPointsUseCase.execute.mockResolvedValue(mockDailyPointsData);

      // Act
      await controller.getDailyPoints(streamerId);

      // Assert
      expect(getDailyPointsUseCase.execute).toHaveBeenCalledWith({
        streamerId: 1,
        date: undefined,
      });
    });

    it('deve validar formato da data', async () => {
      // Arrange
      const invalidDate = 'invalid-date';

      // Act & Assert
      await expect(
        controller.getDailyPoints(streamerId, invalidDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });

    it('deve propagar NotFoundException quando streamer não existe', async () => {
      // Arrange
      const error = new NotFoundException('Streamer não encontrado');
      mockGetDailyPointsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getDailyPoints(999, validDate)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWeeklyRanking', () => {
    const mockRankingData = {
      period: {
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-11'),
      },
      ranking: [
        {
          streamerId: 1,
          nickname: 'TopStreamer',
          totalPoints: 1250,
          position: 1,
        },
        {
          streamerId: 2,
          nickname: 'SecondPlace',
          totalPoints: 980,
          position: 2,
        },
      ],
      metadata: {
        totalStreamers: 2,
      },
    };

    it('deve retornar ranking semanal com sucesso (semana atual)', async () => {
      // Arrange
      mockGetWeeklyRankingUseCase.execute.mockResolvedValue(mockRankingData);

      // Act
      const result = await controller.getWeeklyRanking();

      // Assert
      expect(getWeeklyRankingUseCase.execute).toHaveBeenCalledWith({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
      expect(result).toBeInstanceOf(WeeklyRankingResponseDto);
    });

    it('deve retornar ranking para semana específica', async () => {
      // Arrange
      const startDate = '2025-01-06';
      const endDate = '2025-01-11';
      mockGetWeeklyRankingUseCase.execute.mockResolvedValue(mockRankingData);

      // Act
      await controller.getWeeklyRanking(startDate, endDate);

      // Assert
      expect(getWeeklyRankingUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2025-01-06T00:00:00.000Z'),
        endDate: new Date('2025-01-11T23:59:59.999Z'),
      });
    });

    it('deve validar formato das datas', async () => {
      // Arrange
      const invalidDate = 'invalid-date';
      const validDate = '2025-01-06';

      // Act & Assert
      await expect(
        controller.getWeeklyRanking(invalidDate, validDate),
      ).rejects.toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });
  });

  describe('getWeeklyAverage', () => {
    const streamerId = 1;
    const mockAverageData = {
      streamerId: 1,
      streamerNickname: 'TestStreamer',
      period: {
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-01-11'),
      },
      averagePoints: 85.5,
      totalPoints: 427,
      totalDays: 5,
    };

    it('deve retornar média semanal com sucesso', async () => {
      // Arrange
      mockGetWeeklyAverageUseCase.execute.mockResolvedValue(mockAverageData);

      // Act
      const result = await controller.getWeeklyAverage(streamerId);

      // Assert
      expect(getWeeklyAverageUseCase.execute).toHaveBeenCalledWith({
        streamerId: 1,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
      expect(result.averagePoints).toBe(85.5);
    });

    it('deve validar ID do streamer como número', async () => {
      // Arrange
      mockGetWeeklyAverageUseCase.execute.mockResolvedValue(mockAverageData);

      // Act
      await controller.getWeeklyAverage(streamerId, '2025-01-06', '2025-01-11');

      // Assert
      expect(getWeeklyAverageUseCase.execute).toHaveBeenCalledWith({
        streamerId: expect.any(Number),
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
    });
  });

  describe('getDailyWeek', () => {
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
          ],
          totalPoints: 95,
        },
      ],
      summary: {
        totalDays: 6,
        totalPoints: 95,
        averagePointsPerDay: 15.8,
      },
    };

    it('deve retornar pontos diários da semana com sucesso', async () => {
      // Arrange
      mockGetDailyScoresWeekUseCase.execute.mockResolvedValue(mockDailyData);

      // Act
      const result = await controller.getDailyWeek();

      // Assert
      expect(getDailyScoresWeekUseCase.execute).toHaveBeenCalledWith({
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      });
      expect(result.dailyScores).toBeDefined();
    });

    it('deve usar datas específicas quando fornecidas', async () => {
      // Arrange
      const startDate = '2025-01-06';
      const endDate = '2025-01-11';
      mockGetDailyScoresWeekUseCase.execute.mockResolvedValue(mockDailyData);

      // Act
      await controller.getDailyWeek(startDate, endDate);

      // Assert
      expect(getDailyScoresWeekUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2025-01-06T00:00:00.000Z'),
        endDate: new Date('2025-01-11T23:59:59.999Z'),
      });
    });
  });

  describe('getScoreReport', () => {
    const streamerId = 1;
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';

    const mockReportData = {
      nickname: 'TestStreamer',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      totalPoints: 2500,
      registrationDate: new Date('2025-01-01'),
      scores: [
        {
          id: 1,
          points: 100,
          date: new Date('2025-01-01'),
          hour: 14,
          minute: 30,
        },
        {
          id: 2,
          points: 150,
          date: new Date('2025-01-02'),
          hour: 16,
          minute: 15,
        },
      ],
    };

    it('deve retornar relatório de score com sucesso', async () => {
      // Arrange
      mockGetScoreReportUseCase.execute.mockResolvedValue(mockReportData);

      // Act
      const result = await controller.getScoreReport(
        streamerId,
        startDate,
        endDate,
      );

      // Assert
      expect(getScoreReportUseCase.execute).toHaveBeenCalledWith({
        streamerId: 1,
        startDate: new Date('2025-01-01T00:00:00.000Z'),
        endDate: new Date('2025-01-31T23:59:59.999Z'),
      });
      expect(result.totalPoints).toBe(2500);
    });

    it('deve validar período de datas', async () => {
      // Arrange
      const endDateBeforeStart = '2024-12-31';

      // Act & Assert
      await expect(
        controller.getScoreReport(streamerId, startDate, endDateBeforeStart),
      ).rejects.toThrow('Data de início não pode ser posterior à data de fim.');
    });
  });

  describe('getReportByNickname', () => {
    const nickname = 'teststreamer';
    const startDateTime = '2025-01-01T00:00:00Z';
    const endDateTime = '2025-01-31T23:59:59Z';

    const mockReportData = {
      nickname: 'teststreamer',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      totalPoints: 1800,
      registrationDate: new Date('2025-01-01'),
      scores: [
        {
          id: 3,
          points: 80,
          date: new Date('2025-01-01'),
          hour: 10,
          minute: 0,
        },
      ],
    };

    it('deve retornar relatório por nickname com sucesso', async () => {
      // Arrange
      mockGetReportByNicknameUseCase.execute.mockResolvedValue(mockReportData);

      // Act
      const result = await controller.getReportByNickname(
        nickname,
        startDateTime,
        endDateTime,
      );

      // Assert
      expect(getReportByNicknameUseCase.execute).toHaveBeenCalledWith({
        nickname: 'teststreamer',
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-31T23:59:59Z'),
      });
      expect(result.nickname).toBe('teststreamer');
    });

    it('deve propagar NotFoundException quando nickname não existe', async () => {
      // Arrange
      const error = new NotFoundException('Streamer não encontrado');
      mockGetReportByNicknameUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getReportByNickname(
          'nonexistent',
          startDateTime,
          endDateTime,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validações gerais', () => {
    it('deve ser um controlador válido', () => {
      expect(controller).toBeDefined();
    });

    it('deve ter todos os use cases injetados', () => {
      expect(getDailyPointsUseCase).toBeDefined();
      expect(getScoreReportUseCase).toBeDefined();
      expect(getWeeklyRankingUseCase).toBeDefined();
      expect(getWeeklyAverageUseCase).toBeDefined();
      expect(getDailyScoresWeekUseCase).toBeDefined();
      expect(getReportByNicknameUseCase).toBeDefined();
    });
  });
});
