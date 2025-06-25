import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
  ScoreByHourData,
} from '@application/ports/repositories/score.repository.interface';
import { Test, TestingModule } from '@nestjs/testing';
import { GetScoresByHourUseCase } from './get-scores-by-hour.use-case';

describe('GetScoresByHourUseCase', () => {
  let useCase: GetScoresByHourUseCase;
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetScoresByHourUseCase,
        {
          provide: SCORE_REPOSITORY_TOKEN,
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetScoresByHourUseCase>(GetScoresByHourUseCase);
    scoreRepository = module.get(SCORE_REPOSITORY_TOKEN);

    // Mock Date para tornar testes previsíveis
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-07T15:30:00Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('execute', () => {
    it('deve retornar pontos agrupados por hora com sucesso', async () => {
      // Arrange
      const command = {
        date: new Date('2025-01-07T00:00:00Z'),
      };

      const mockScoreData: ScoreByHourData[] = [
        {
          streamerId: 1,
          nickname: 'barba_09a',
          pointsByHour: {
            '1h': 10,
            '2h': 15,
            '3h': 5,
          },
        },
        {
          streamerId: 2,
          nickname: 'aggeotv',
          pointsByHour: {
            '1h': 8,
            '2h': 12,
            '4h': 20,
          },
        },
      ];

      mockScoreRepository.getScoresByDateGroupedByHour.mockResolvedValue(
        mockScoreData,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(scoreRepository.getScoresByDateGroupedByHour).toHaveBeenCalledWith(
        new Date('2025-01-07T00:00:00Z'),
      );

      expect(result).toEqual({
        date: new Date('2025-01-07T00:00:00Z'),
        streamers: [
          {
            streamerId: 1,
            nickname: 'barba_09a',
            pointsByHour: {
              '1h': 10,
              '2h': 15,
              '3h': 5,
            },
          },
          {
            streamerId: 2,
            nickname: 'aggeotv',
            pointsByHour: {
              '1h': 8,
              '2h': 12,
              '4h': 20,
            },
          },
        ],
      });
    });

    it('deve usar data atual quando não informada', async () => {
      // Arrange
      const command = {};

      const mockScoreData: ScoreByHourData[] = [
        {
          streamerId: 1,
          nickname: 'barba_09a',
          pointsByHour: {
            '15h': 25,
          },
        },
      ];

      mockScoreRepository.getScoresByDateGroupedByHour.mockResolvedValue(
        mockScoreData,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(scoreRepository.getScoresByDateGroupedByHour).toHaveBeenCalledWith(
        new Date('2025-01-07T15:30:00Z'),
      );

      expect(result.date).toEqual(new Date('2025-01-07T15:30:00Z'));
      expect(result.streamers).toHaveLength(1);
      expect(result.streamers[0].pointsByHour['15h']).toBe(25);
    });

    it('deve retornar array vazio quando não há scores no dia', async () => {
      // Arrange
      const command = {
        date: new Date('2025-01-07T00:00:00Z'),
      };

      mockScoreRepository.getScoresByDateGroupedByHour.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.streamers).toEqual([]);
      expect(result.date).toEqual(new Date('2025-01-07T00:00:00Z'));
    });

    it('deve retornar dados corretos para um único streamer com múltiplas horas', async () => {
      // Arrange
      const command = {
        date: new Date('2025-01-07T00:00:00Z'),
      };

      const mockScoreData: ScoreByHourData[] = [
        {
          streamerId: 1,
          nickname: 'barba_09a',
          pointsByHour: {
            '9h': 5,
            '10h': 10,
            '11h': 15,
            '12h': 8,
            '13h': 12,
            '14h': 20,
          },
        },
      ];

      mockScoreRepository.getScoresByDateGroupedByHour.mockResolvedValue(
        mockScoreData,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.streamers).toHaveLength(1);
      expect(result.streamers[0].nickname).toBe('barba_09a');
      expect(Object.keys(result.streamers[0].pointsByHour)).toHaveLength(6);
      expect(result.streamers[0].pointsByHour['14h']).toBe(20);
    });

    it('deve incluir pontos negativos no agrupamento', async () => {
      // Arrange
      const command = {
        date: new Date('2025-01-07T00:00:00Z'),
      };

      const mockScoreData: ScoreByHourData[] = [
        {
          streamerId: 1,
          nickname: 'barba_09a',
          pointsByHour: {
            '10h': 15,
            '11h': -5, // Penalidade
            '12h': 10,
          },
        },
      ];

      mockScoreRepository.getScoresByDateGroupedByHour.mockResolvedValue(
        mockScoreData,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.streamers[0].pointsByHour['11h']).toBe(-5);
      expect(result.streamers[0].pointsByHour['10h']).toBe(15);
      expect(result.streamers[0].pointsByHour['12h']).toBe(10);
    });
  });
});
