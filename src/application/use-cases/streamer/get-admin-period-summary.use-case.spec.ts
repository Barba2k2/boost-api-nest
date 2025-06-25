import { Test, TestingModule } from '@nestjs/testing';
import {
  GetAdminPeriodSummaryCommand,
  GetAdminPeriodSummaryUseCase,
} from './get-admin-period-summary.use-case';
import { GetDailyScoresWeekUseCase } from './get-daily-scores-week.use-case';
import { GetWeeklyRankingUseCase } from './get-weekly-ranking.use-case';

describe('GetAdminPeriodSummaryUseCase', () => {
  let useCase: GetAdminPeriodSummaryUseCase;
  let getWeeklyRankingUseCase: jest.Mocked<GetWeeklyRankingUseCase>;
  let getDailyScoresWeekUseCase: jest.Mocked<GetDailyScoresWeekUseCase>;

  const mockGetWeeklyRankingUseCase = {
    execute: jest.fn(),
  };

  const mockGetDailyScoresWeekUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAdminPeriodSummaryUseCase,
        {
          provide: GetWeeklyRankingUseCase,
          useValue: mockGetWeeklyRankingUseCase,
        },
        {
          provide: GetDailyScoresWeekUseCase,
          useValue: mockGetDailyScoresWeekUseCase,
        },
      ],
    }).compile();

    useCase = module.get<GetAdminPeriodSummaryUseCase>(
      GetAdminPeriodSummaryUseCase,
    );
    getWeeklyRankingUseCase = module.get(GetWeeklyRankingUseCase);
    getDailyScoresWeekUseCase = module.get(GetDailyScoresWeekUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: GetAdminPeriodSummaryCommand = {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-21'),
    };

    const mockRankingData = {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-21'),
      ranking: [
        {
          streamerId: 1,
          nickname: 'streamer1',
          totalPoints: 500,
          averagePoints: 71.4,
          position: 1,
          dailyPoints: {
            monday: 100,
            tuesday: 80,
            wednesday: 90,
            thursday: 70,
            friday: 85,
            saturday: 75,
            sunday: 0,
          },
        },
        {
          streamerId: 2,
          nickname: 'streamer2',
          totalPoints: 300,
          averagePoints: 42.9,
          position: 2,
          dailyPoints: {
            monday: 60,
            tuesday: 50,
            wednesday: 40,
            thursday: 45,
            friday: 55,
            saturday: 50,
            sunday: 0,
          },
        },
        {
          streamerId: 3,
          nickname: 'streamer3',
          totalPoints: 200,
          averagePoints: 28.6,
          position: 3,
          dailyPoints: {
            monday: 30,
            tuesday: 35,
            wednesday: 25,
            thursday: 40,
            friday: 35,
            saturday: 35,
            sunday: 0,
          },
        },
      ],
    };

    const mockDailyScoresData = {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-21'),
      dailyScores: [
        {
          date: new Date('2024-01-15'),
          dayOfWeek: 'monday',
          streamers: [
            { streamerId: 1, nickname: 'streamer1', points: 100 },
            { streamerId: 2, nickname: 'streamer2', points: 60 },
            { streamerId: 3, nickname: 'streamer3', points: 30 },
          ],
        },
        {
          date: new Date('2024-01-16'),
          dayOfWeek: 'tuesday',
          streamers: [
            { streamerId: 1, nickname: 'streamer1', points: 80 },
            { streamerId: 2, nickname: 'streamer2', points: 50 },
            { streamerId: 3, nickname: 'streamer3', points: 35 },
          ],
        },
        {
          date: new Date('2024-01-17'),
          dayOfWeek: 'wednesday',
          streamers: [
            { streamerId: 1, nickname: 'streamer1', points: 90 },
            { streamerId: 2, nickname: 'streamer2', points: 40 },
            { streamerId: 3, nickname: 'streamer3', points: 25 },
          ],
        },
      ],
    };

    beforeEach(() => {
      getWeeklyRankingUseCase.execute.mockResolvedValue(mockRankingData);
      getDailyScoresWeekUseCase.execute.mockResolvedValue(mockDailyScoresData);
    });

    it('deve retornar resumo do período com sucesso', async () => {
      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(getWeeklyRankingUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-21'),
      });
      expect(getDailyScoresWeekUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-21'),
      });

      expect(result.period).toEqual({
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-21'),
        totalDays: 3,
      });

      expect(result.statistics).toEqual({
        totalStreamers: 3,
        totalPoints: 1000, // 500 + 300 + 200
        averagePointsPerStreamer: 333.33, // 1000 / 3 arredondado
        topStreamer: {
          nickname: 'streamer1',
          totalPoints: 500,
          averagePoints: 71.4,
        },
      });

      expect(result.pointsByDay).toEqual({
        monday: 190, // 100 + 60 + 30
        tuesday: 165, // 80 + 50 + 35
        wednesday: 155, // 90 + 40 + 25
      });

      expect(result.ranking).toEqual(mockRankingData.ranking);
      expect(result.dailyBreakdown).toEqual(mockDailyScoresData.dailyScores);
    });

    it('deve lidar com ranking vazio', async () => {
      // Arrange
      const emptyRankingData = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-21'),
        ranking: [],
      };

      getWeeklyRankingUseCase.execute.mockResolvedValue(emptyRankingData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.statistics).toEqual({
        totalStreamers: 0,
        totalPoints: 0,
        averagePointsPerStreamer: 0,
        topStreamer: null,
      });

      expect(result.ranking).toEqual([]);
    });

    it('deve lidar com dias sem pontos', async () => {
      // Arrange
      const emptyDailyScoresData = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-21'),
        dailyScores: [
          {
            date: new Date('2024-01-15'),
            dayOfWeek: 'monday',
            streamers: [],
          },
          {
            date: new Date('2024-01-16'),
            dayOfWeek: 'tuesday',
            streamers: [],
          },
        ],
      };

      getDailyScoresWeekUseCase.execute.mockResolvedValue(emptyDailyScoresData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.pointsByDay).toEqual({
        monday: 0,
        tuesday: 0,
      });

      expect(result.period.totalDays).toBe(2);
    });

    it('deve calcular corretamente estatísticas com um único streamer', async () => {
      // Arrange
      const singleStreamerRanking = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-21'),
        ranking: [
          {
            streamerId: 1,
            nickname: 'onlystreamer',
            totalPoints: 150,
            averagePoints: 25.0,
            position: 1,
            dailyPoints: { monday: 150 },
          },
        ],
      };

      getWeeklyRankingUseCase.execute.mockResolvedValue(singleStreamerRanking);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.statistics).toEqual({
        totalStreamers: 1,
        totalPoints: 150,
        averagePointsPerStreamer: 150, // 150 / 1
        topStreamer: {
          nickname: 'onlystreamer',
          totalPoints: 150,
          averagePoints: 25.0,
        },
      });
    });

    it('deve executar os use cases em paralelo', async () => {
      // Arrange
      let resolveRanking: (value: any) => void;
      let resolveDailyScores: (value: any) => void;

      const rankingPromise = new Promise<any>((resolve) => {
        resolveRanking = resolve;
      });
      const dailyScoresPromise = new Promise<any>((resolve) => {
        resolveDailyScores = resolve;
      });

      getWeeklyRankingUseCase.execute.mockReturnValue(rankingPromise);
      getDailyScoresWeekUseCase.execute.mockReturnValue(dailyScoresPromise);

      // Act
      const resultPromise = useCase.execute(validCommand);

      // Verificar que ambos os use cases foram chamados antes da resolução
      expect(getWeeklyRankingUseCase.execute).toHaveBeenCalled();
      expect(getDailyScoresWeekUseCase.execute).toHaveBeenCalled();

      // Resolver as promises
      resolveRanking!(mockRankingData);
      resolveDailyScores!(mockDailyScoresData);

      // Assert
      const result = await resultPromise;
      expect(result).toBeDefined();
    });

    it('deve arredondar média de pontos corretamente', async () => {
      // Arrange
      const rankingWithDecimals = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-21'),
        ranking: [
          {
            streamerId: 1,
            nickname: 'streamer1',
            totalPoints: 100,
            averagePoints: 14.29,
            position: 1,
            dailyPoints: {},
          },
          {
            streamerId: 2,
            nickname: 'streamer2',
            totalPoints: 100,
            averagePoints: 14.29,
            position: 2,
            dailyPoints: {},
          },
          {
            streamerId: 3,
            nickname: 'streamer3',
            totalPoints: 100,
            averagePoints: 14.29,
            position: 3,
            dailyPoints: {},
          },
        ],
      };

      getWeeklyRankingUseCase.execute.mockResolvedValue(rankingWithDecimals);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.statistics.averagePointsPerStreamer).toBe(100); // 300 / 3 = 100 exato
    });

    it('deve lidar com diferentes períodos de datas', async () => {
      // Arrange
      const differentCommand: GetAdminPeriodSummaryCommand = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
      };

      // Act
      await useCase.execute(differentCommand);

      // Assert
      expect(getWeeklyRankingUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
      });
      expect(getDailyScoresWeekUseCase.execute).toHaveBeenCalledWith({
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
      });
    });
  });
});
