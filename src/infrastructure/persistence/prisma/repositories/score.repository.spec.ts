import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ScoreReportRepository } from './score-report.repository';
import { ScoreValidationRepository } from './score-validation.repository';
import { ScoreRepository } from './score.repository';

describe('ScoreRepository', () => {
  let repository: ScoreRepository;
  let prismaService: jest.Mocked<PrismaService>;
  let scoreValidationRepository: jest.Mocked<ScoreValidationRepository>;
  let scoreReportRepository: jest.Mocked<ScoreReportRepository>;

  const mockPrismaService = {
    score: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    streamer: {
      findUnique: jest.fn(),
    },
  };

  const mockScoreValidationRepository = {
    validateScoreCreation: jest.fn(),
    getDailyPointsByStreamerAndDate: jest.fn(),
  };

  const mockScoreReportRepository = {
    getScoreReportByPeriod: jest.fn(),
    getScoresByDateGroupedByHour: jest.fn(),
    getWeeklyRanking: jest.fn(),
    getWeeklyAverage: jest.fn(),
    getDailyScoresForWeek: jest.fn(),
  };

  const mockPrismaScore = {
    id: 1,
    streamerId: 1,
    date: new Date('2024-01-01T10:30:00Z'),
    hour: 10,
    minute: 30,
    points: 5,
    createdAt: new Date('2024-01-01T10:30:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ScoreValidationRepository,
          useValue: mockScoreValidationRepository,
        },
        {
          provide: ScoreReportRepository,
          useValue: mockScoreReportRepository,
        },
      ],
    }).compile();

    repository = module.get<ScoreRepository>(ScoreRepository);
    prismaService = module.get(PrismaService);
    scoreValidationRepository = module.get(ScoreValidationRepository);
    scoreReportRepository = module.get(ScoreReportRepository);

    // Mock Date.now para tornar testes previsíveis
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T10:30:00Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('create', () => {
    it('deve criar um score com sucesso quando validação passa', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        date: new Date('2024-01-01T10:30:00Z'),
        hour: 10,
        minute: 30,
        points: 5,
      };

      mockScoreValidationRepository.validateScoreCreation.mockResolvedValue(
        undefined,
      );
      mockPrismaService.score.create.mockResolvedValue(mockPrismaScore);

      // Act
      const result = await repository.create(scoreData);

      // Assert
      expect(
        mockScoreValidationRepository.validateScoreCreation,
      ).toHaveBeenCalledWith(1, new Date('2024-01-01T10:30:00Z'), 10, 5);

      expect(mockPrismaService.score.create).toHaveBeenCalledWith({
        data: {
          streamerId: 1,
          date: new Date('2024-01-01T10:30:00Z'),
          hour: 10,
          minute: 30,
          points: 5,
        },
      });

      expect(result.points).toBe(5);
      expect(result.streamerId).toBe(1);
    });

    it('deve propagar erro quando validação falha', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        date: new Date('2024-01-01T10:30:00Z'),
        hour: 10,
        minute: 30,
        points: 50,
      };

      const validationError = new Error('Limite diário excedido');
      mockScoreValidationRepository.validateScoreCreation.mockRejectedValue(
        validationError,
      );

      // Act & Assert
      await expect(repository.create(scoreData)).rejects.toThrow(
        'Limite diário excedido',
      );

      expect(
        mockScoreValidationRepository.validateScoreCreation,
      ).toHaveBeenCalledWith(1, new Date('2024-01-01T10:30:00Z'), 10, 50);

      expect(mockPrismaService.score.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('deve encontrar um score por ID', async () => {
      // Arrange
      mockPrismaService.score.findUnique.mockResolvedValue(mockPrismaScore);

      // Act
      const result = await repository.findById(1);

      // Assert
      expect(mockPrismaService.score.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.streamerId).toBe(1);
      expect(result?.points).toBe(5);
    });

    it('deve retornar null quando score não encontrado', async () => {
      // Arrange
      mockPrismaService.score.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById(999);

      // Assert
      expect(mockPrismaService.score.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByStreamerId', () => {
    it('deve encontrar scores por streamerId', async () => {
      // Arrange
      const mockScores = [
        mockPrismaScore,
        { ...mockPrismaScore, id: 2, points: 10 },
      ];
      mockPrismaService.score.findMany.mockResolvedValue(mockScores);

      // Act
      const result = await repository.findByStreamerId(1);

      // Assert
      expect(mockPrismaService.score.findMany).toHaveBeenCalledWith({
        where: { streamerId: 1 },
        orderBy: { date: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].streamerId).toBe(1);
      expect(result[1].streamerId).toBe(1);
    });

    it('deve retornar array vazio quando não há scores', async () => {
      // Arrange
      mockPrismaService.score.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findByStreamerId(999);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os scores', async () => {
      // Arrange
      const mockScores = [mockPrismaScore];
      mockPrismaService.score.findMany.mockResolvedValue(mockScores);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(mockPrismaService.score.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('deve deletar um score por ID', async () => {
      // Arrange
      mockPrismaService.score.delete.mockResolvedValue(mockPrismaScore);

      // Act
      await repository.delete(1);

      // Assert
      expect(mockPrismaService.score.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('getTotalPointsByStreamerId', () => {
    it('deve retornar total de pontos para um streamer', async () => {
      // Arrange
      mockPrismaService.score.aggregate.mockResolvedValue({
        _sum: { points: 150 },
      });

      // Act
      const result = await repository.getTotalPointsByStreamerId(1);

      // Assert
      expect(mockPrismaService.score.aggregate).toHaveBeenCalledWith({
        where: { streamerId: 1 },
        _sum: { points: true },
      });
      expect(result).toBe(150);
    });

    it('deve retornar 0 quando não há pontos', async () => {
      // Arrange
      mockPrismaService.score.aggregate.mockResolvedValue({
        _sum: { points: null },
      });

      // Act
      const result = await repository.getTotalPointsByStreamerId(1);

      // Assert
      expect(result).toBe(0);
    });

    it('deve retornar total negativo corretamente', async () => {
      // Arrange
      mockPrismaService.score.aggregate.mockResolvedValue({
        _sum: { points: -50 },
      });

      // Act
      const result = await repository.getTotalPointsByStreamerId(1);

      // Assert
      expect(result).toBe(-50);
    });
  });

  describe('getDailyPointsByStreamerAndDate', () => {
    it('deve delegar para o repositório de validação', async () => {
      // Arrange
      const date = new Date('2024-01-01');
      mockScoreValidationRepository.getDailyPointsByStreamerAndDate.mockResolvedValue(
        100,
      );

      // Act
      const result = await repository.getDailyPointsByStreamerAndDate(1, date);

      // Assert
      expect(
        mockScoreValidationRepository.getDailyPointsByStreamerAndDate,
      ).toHaveBeenCalledWith(1, date);
      expect(result).toBe(100);
    });
  });

  describe('getScoreReportByPeriod', () => {
    it('deve delegar para o repositório de relatórios', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      const mockReport = { totalPoints: 100, averagePoints: 14.3 };
      mockScoreReportRepository.getScoreReportByPeriod.mockResolvedValue(
        mockReport,
      );

      // Act
      const result = await repository.getScoreReportByPeriod(
        1,
        startDate,
        endDate,
      );

      // Assert
      expect(
        mockScoreReportRepository.getScoreReportByPeriod,
      ).toHaveBeenCalledWith(1, startDate, endDate);
      expect(result).toBe(mockReport);
    });
  });
});
