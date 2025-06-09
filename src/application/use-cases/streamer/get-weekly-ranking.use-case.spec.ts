import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
  WeeklyRankingData,
} from '@application/ports/repositories/score.repository.interface';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GetWeeklyRankingCommand,
  GetWeeklyRankingUseCase,
} from './get-weekly-ranking.use-case';

describe('GetWeeklyRankingUseCase', () => {
  let useCase: GetWeeklyRankingUseCase;
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
        GetWeeklyRankingUseCase,
        {
          provide: SCORE_REPOSITORY_TOKEN,
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetWeeklyRankingUseCase>(GetWeeklyRankingUseCase);
    scoreRepository = module.get(SCORE_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: GetWeeklyRankingCommand = {
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
    };

    const mockRankingData: WeeklyRankingData[] = [
      {
        position: 1,
        streamerId: 1,
        nickname: 'topstreamer',
        totalPoints: 500,
        averagePoints: 100.0,
        dailyPoints: {
          monday: 120,
          tuesday: 100,
          wednesday: 110,
          thursday: 90,
          friday: 80,
        },
      },
      {
        position: 2,
        streamerId: 2,
        nickname: 'secondstreamer',
        totalPoints: 350,
        averagePoints: 87.5,
        dailyPoints: {
          monday: 80,
          tuesday: 90,
          wednesday: 85,
          thursday: 95,
        },
      },
      {
        position: 3,
        streamerId: 3,
        nickname: 'thirdstreamer',
        totalPoints: 200,
        averagePoints: 50.0,
        dailyPoints: {
          monday: 50,
          tuesday: 50,
          wednesday: 50,
          thursday: 50,
        },
      },
    ];

    it('deve retornar ranking semanal ordenado por pontos', async () => {
      // Arrange
      scoreRepository.getWeeklyRanking.mockResolvedValue(mockRankingData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(scoreRepository.getWeeklyRanking).toHaveBeenCalledWith(
        validCommand.startDate,
        validCommand.endDate,
      );

      expect(result).toEqual({
        startDate: validCommand.startDate,
        endDate: validCommand.endDate,
        ranking: mockRankingData,
      });

      // Verificar ordenação por pontos
      expect(result.ranking[0].totalPoints).toBeGreaterThan(
        result.ranking[1].totalPoints,
      );
      expect(result.ranking[1].totalPoints).toBeGreaterThan(
        result.ranking[2].totalPoints,
      );
    });

    it('deve retornar ranking vazio quando não há dados', async () => {
      // Arrange
      scoreRepository.getWeeklyRanking.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(scoreRepository.getWeeklyRanking).toHaveBeenCalledWith(
        validCommand.startDate,
        validCommand.endDate,
      );

      expect(result).toEqual({
        startDate: validCommand.startDate,
        endDate: validCommand.endDate,
        ranking: [],
      });
    });

    it('deve lançar erro quando data de início é posterior à data de fim', async () => {
      // Arrange
      const invalidCommand: GetWeeklyRankingCommand = {
        startDate: new Date('2024-01-21T00:00:00Z'),
        endDate: new Date('2024-01-15T00:00:00Z'),
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(
        'Data de início não pode ser posterior à data de fim',
      );

      expect(scoreRepository.getWeeklyRanking).not.toHaveBeenCalled();
    });

    it('deve retornar posições corretas no ranking', async () => {
      // Arrange
      scoreRepository.getWeeklyRanking.mockResolvedValue(mockRankingData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.ranking[0].position).toBe(1);
      expect(result.ranking[1].position).toBe(2);
      expect(result.ranking[2].position).toBe(3);
    });

    it('deve incluir pontos diários no ranking', async () => {
      // Arrange
      scoreRepository.getWeeklyRanking.mockResolvedValue(mockRankingData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.ranking[0].dailyPoints).toEqual({
        monday: 120,
        tuesday: 100,
        wednesday: 110,
        thursday: 90,
        friday: 80,
      });

      expect(result.ranking[1].dailyPoints).toEqual({
        monday: 80,
        tuesday: 90,
        wednesday: 85,
        thursday: 95,
      });
    });

    it('deve calcular média de pontos corretamente', async () => {
      // Arrange
      scoreRepository.getWeeklyRanking.mockResolvedValue(mockRankingData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.ranking[0].averagePoints).toBe(100.0);
      expect(result.ranking[1].averagePoints).toBe(87.5);
      expect(result.ranking[2].averagePoints).toBe(50.0);
    });

    it('deve lidar com streamer único no ranking', async () => {
      // Arrange
      const singleStreamerRanking: WeeklyRankingData[] = [
        {
          position: 1,
          streamerId: 1,
          nickname: 'onlystreamer',
          totalPoints: 300,
          averagePoints: 75.0,
          dailyPoints: {
            monday: 100,
            tuesday: 100,
            wednesday: 100,
          },
        },
      ];

      scoreRepository.getWeeklyRanking.mockResolvedValue(singleStreamerRanking);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.ranking).toHaveLength(1);
      expect(result.ranking[0].position).toBe(1);
      expect(result.ranking[0].nickname).toBe('onlystreamer');
    });

    it('deve propagar erros do repositório', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      scoreRepository.getWeeklyRanking.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('deve lidar com streamers com pontos decimais', async () => {
      // Arrange
      const decimalRanking: WeeklyRankingData[] = [
        {
          position: 1,
          streamerId: 1,
          nickname: 'decimal-streamer',
          totalPoints: 100,
          averagePoints: 33.33,
          dailyPoints: { monday: 50, tuesday: 50 },
        },
      ];

      scoreRepository.getWeeklyRanking.mockResolvedValue(decimalRanking);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.ranking[0].averagePoints).toBe(33.33);
    });

    it('deve funcionar com período de uma semana completa', async () => {
      // Arrange
      const fullWeekCommand: GetWeeklyRankingCommand = {
        startDate: new Date('2024-01-15T00:00:00Z'), // Segunda
        endDate: new Date('2024-01-21T23:59:59Z'), // Domingo
      };

      scoreRepository.getWeeklyRanking.mockResolvedValue(mockRankingData);

      // Act
      const result = await useCase.execute(fullWeekCommand);

      // Assert
      expect(scoreRepository.getWeeklyRanking).toHaveBeenCalledWith(
        fullWeekCommand.startDate,
        fullWeekCommand.endDate,
      );

      expect(result.startDate).toEqual(fullWeekCommand.startDate);
      expect(result.endDate).toEqual(fullWeekCommand.endDate);
    });
  });
});
