import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
  ScoreReportData,
} from '@application/ports/repositories/score.repository.interface';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GetScoreReportUseCase } from './get-score-report.use-case';

describe('GetScoreReportUseCase', () => {
  let useCase: GetScoreReportUseCase;
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetScoreReportUseCase,
        {
          provide: SCORE_REPOSITORY_TOKEN,
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetScoreReportUseCase>(GetScoreReportUseCase);
    scoreRepository = module.get(SCORE_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar relatório de pontos com sucesso', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-07T23:59:59Z'),
      };

      const mockReportData: ScoreReportData = {
        streamerId: 1,
        nickname: 'aggeotv',
        totalPoints: 750,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-07T23:59:59Z'),
        registrationDate: new Date('2024-06-07T18:25:32Z'),
        scores: [
          {
            id: 1,
            points: 10,
            date: new Date('2025-01-01T10:00:00Z'),
            hour: 10,
            minute: 0,
          },
          {
            id: 2,
            points: 15,
            date: new Date('2025-01-02T14:30:00Z'),
            hour: 14,
            minute: 30,
          },
        ],
      };

      mockScoreRepository.getScoreReportByPeriod.mockResolvedValue(
        mockReportData,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(scoreRepository.getScoreReportByPeriod).toHaveBeenCalledWith(
        1,
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-01-07T23:59:59Z'),
      );

      expect(result).toEqual({
        streamerId: 1,
        nickname: 'aggeotv',
        totalPoints: 750,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-07T23:59:59Z'),
        registrationDate: new Date('2024-06-07T18:25:32Z'),
        scores: [
          {
            id: 1,
            points: 10,
            date: new Date('2025-01-01T10:00:00Z'),
            hour: 10,
            minute: 0,
          },
          {
            id: 2,
            points: 15,
            date: new Date('2025-01-02T14:30:00Z'),
            hour: 14,
            minute: 30,
          },
        ],
      });
    });

    it('deve lançar NotFoundException quando streamer não encontrado', async () => {
      // Arrange
      const command = {
        streamerId: 999,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-07T23:59:59Z'),
      };

      mockScoreRepository.getScoreReportByPeriod.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(command)).rejects.toThrow(
        'Streamer com ID 999 não encontrado',
      );
    });

    it('deve lançar erro quando data de início é posterior à data de fim', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        startDate: new Date('2025-01-07T00:00:00Z'),
        endDate: new Date('2025-01-01T23:59:59Z'),
      };

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Data de início não pode ser posterior à data de fim',
      );

      // Verificar que o repositório não foi chamado
      expect(scoreRepository.getScoreReportByPeriod).not.toHaveBeenCalled();
    });

    it('deve retornar relatório vazio quando não há scores no período', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-07T23:59:59Z'),
      };

      const mockReportData: ScoreReportData = {
        streamerId: 1,
        nickname: 'aggeotv',
        totalPoints: 0,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-07T23:59:59Z'),
        registrationDate: new Date('2024-06-07T18:25:32Z'),
        scores: [],
      };

      mockScoreRepository.getScoreReportByPeriod.mockResolvedValue(
        mockReportData,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.totalPoints).toBe(0);
      expect(result.scores).toEqual([]);
    });

    it('deve retornar relatório com pontos negativos incluídos', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-07T23:59:59Z'),
      };

      const mockReportData: ScoreReportData = {
        streamerId: 1,
        nickname: 'aggeotv',
        totalPoints: 5, // 15 - 10 = 5
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-07T23:59:59Z'),
        registrationDate: new Date('2024-06-07T18:25:32Z'),
        scores: [
          {
            id: 1,
            points: 15,
            date: new Date('2025-01-01T10:00:00Z'),
            hour: 10,
            minute: 0,
          },
          {
            id: 2,
            points: -10,
            date: new Date('2025-01-02T14:30:00Z'),
            hour: 14,
            minute: 30,
          },
        ],
      };

      mockScoreRepository.getScoreReportByPeriod.mockResolvedValue(
        mockReportData,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.totalPoints).toBe(5);
      expect(result.scores).toHaveLength(2);
      expect(result.scores[1].points).toBe(-10);
    });
  });
});
