import {
  DailyScoreData,
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
} from '@application/ports/repositories/score.repository.interface';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GetDailyScoresWeekCommand,
  GetDailyScoresWeekUseCase,
} from './get-daily-scores-week.use-case';

describe('GetDailyScoresWeekUseCase', () => {
  let useCase: GetDailyScoresWeekUseCase;
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
        GetDailyScoresWeekUseCase,
        {
          provide: SCORE_REPOSITORY_TOKEN,
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetDailyScoresWeekUseCase>(GetDailyScoresWeekUseCase);
    scoreRepository = module.get(SCORE_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: GetDailyScoresWeekCommand = {
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
    };

    const mockDailyScores: DailyScoreData[] = [
      {
        date: new Date('2024-01-15T00:00:00Z'),
        dayOfWeek: 'monday',
        streamers: [
          { streamerId: 1, nickname: 'streamer1', points: 100 },
          { streamerId: 2, nickname: 'streamer2', points: 80 },
        ],
      },
      {
        date: new Date('2024-01-16T00:00:00Z'),
        dayOfWeek: 'tuesday',
        streamers: [
          { streamerId: 1, nickname: 'streamer1', points: 120 },
          { streamerId: 3, nickname: 'streamer3', points: 90 },
        ],
      },
    ];

    it('deve retornar pontuações diárias da semana com sucesso', async () => {
      // Arrange
      scoreRepository.getDailyScoresForWeek.mockResolvedValue(mockDailyScores);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(scoreRepository.getDailyScoresForWeek).toHaveBeenCalledWith(
        validCommand.startDate,
        validCommand.endDate,
      );

      expect(result).toEqual({
        startDate: validCommand.startDate,
        endDate: validCommand.endDate,
        dailyScores: mockDailyScores,
      });
    });

    it('deve retornar lista vazia quando não há pontuações', async () => {
      // Arrange
      scoreRepository.getDailyScoresForWeek.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(scoreRepository.getDailyScoresForWeek).toHaveBeenCalledWith(
        validCommand.startDate,
        validCommand.endDate,
      );

      expect(result).toEqual({
        startDate: validCommand.startDate,
        endDate: validCommand.endDate,
        dailyScores: [],
      });
    });

    it('deve lançar erro quando data de início é posterior à data de fim', async () => {
      // Arrange
      const invalidCommand: GetDailyScoresWeekCommand = {
        startDate: new Date('2024-01-21T00:00:00Z'),
        endDate: new Date('2024-01-15T00:00:00Z'),
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(
        'Data de início não pode ser posterior à data de fim',
      );

      expect(scoreRepository.getDailyScoresForWeek).not.toHaveBeenCalled();
    });

    it('deve lidar com dias da semana em português', async () => {
      // Arrange
      const portugueseDailyScores: DailyScoreData[] = [
        {
          date: new Date('2024-01-15T00:00:00Z'),
          dayOfWeek: 'segunda-feira',
          streamers: [{ streamerId: 1, nickname: 'streamer1', points: 100 }],
        },
        {
          date: new Date('2024-01-16T00:00:00Z'),
          dayOfWeek: 'terça-feira',
          streamers: [{ streamerId: 2, nickname: 'streamer2', points: 80 }],
        },
      ];

      scoreRepository.getDailyScoresForWeek.mockResolvedValue(
        portugueseDailyScores,
      );

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.dailyScores).toEqual(portugueseDailyScores);
    });

    it('deve lidar com streamers com pontuação zero', async () => {
      // Arrange
      const scoresWithZero: DailyScoreData[] = [
        {
          date: new Date('2024-01-15T00:00:00Z'),
          dayOfWeek: 'monday',
          streamers: [
            { streamerId: 1, nickname: 'streamer1', points: 0 },
            { streamerId: 2, nickname: 'streamer2', points: 100 },
          ],
        },
      ];

      scoreRepository.getDailyScoresForWeek.mockResolvedValue(scoresWithZero);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.dailyScores[0].streamers).toHaveLength(2);
      expect(result.dailyScores[0].streamers[0].points).toBe(0);
    });

    it('deve preservar a ordenação dos streamers por pontos', async () => {
      // Arrange
      const orderedScores: DailyScoreData[] = [
        {
          date: new Date('2024-01-15T00:00:00Z'),
          dayOfWeek: 'monday',
          streamers: [
            { streamerId: 1, nickname: 'first', points: 200 },
            { streamerId: 2, nickname: 'second', points: 150 },
            { streamerId: 3, nickname: 'third', points: 100 },
          ],
        },
      ];

      scoreRepository.getDailyScoresForWeek.mockResolvedValue(orderedScores);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.dailyScores[0].streamers[0].points).toBeGreaterThan(
        result.dailyScores[0].streamers[1].points,
      );
      expect(result.dailyScores[0].streamers[1].points).toBeGreaterThan(
        result.dailyScores[0].streamers[2].points,
      );
    });

    it('deve propagar erros do repositório', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      scoreRepository.getDailyScoresForWeek.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
