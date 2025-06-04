import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ScoreRepository } from './score.repository';

describe('ScoreRepository', () => {
  let repository: ScoreRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    score: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockPrismaScore = {
    id: 1,
    streamerId: 1,
    date: new Date('2024-01-01T10:30:00Z'),
    hour: 10,
    minute: 30,
    points: 50,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ScoreRepository>(ScoreRepository);
    prismaService = module.get(PrismaService);

    // Mock Date.now para tornar testes previsíveis
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T10:30:00Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('create', () => {
    it('deve criar um score com sucesso', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: 50,
        reason: 'Boa performance na stream',
      };
      mockPrismaService.score.create.mockResolvedValue(mockPrismaScore);

      // Act
      const result = await repository.create(scoreData);

      // Assert
      expect(mockPrismaService.score.create).toHaveBeenCalledWith({
        data: {
          streamerId: 1,
          date: new Date('2024-01-01T10:30:00Z'),
          hour: 7, // UTC -3 (timezone local)
          minute: 30,
          points: 50,
        },
      });
      expect(result.id).toBe(1);
      expect(result.streamerId).toBe(1);
      expect(result.points).toBe(50);
      expect(result.reason).toBe('Boa performance na stream');
    });

    it('deve criar um score negativo', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: -20,
        reason: 'Stream cancelada',
      };
      const negativeScore = { ...mockPrismaScore, points: -20 };
      mockPrismaService.score.create.mockResolvedValue(negativeScore);

      // Act
      const result = await repository.create(scoreData);

      // Assert
      expect(mockPrismaService.score.create).toHaveBeenCalledWith({
        data: {
          streamerId: 1,
          date: new Date('2024-01-01T10:30:00Z'),
          hour: 7, // UTC -3 (timezone local)
          minute: 30,
          points: -20,
        },
      });
      expect(result.points).toBe(-20);
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
      expect(result!.id).toBe(1);
      expect(result!.reason).toBe('Score record');
    });

    it('deve retornar null quando score não encontrado', async () => {
      // Arrange
      mockPrismaService.score.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByStreamerId', () => {
    it('deve encontrar scores por streamerId', async () => {
      // Arrange
      const scores = [
        mockPrismaScore,
        { ...mockPrismaScore, id: 2, points: 30 },
      ];
      mockPrismaService.score.findMany.mockResolvedValue(scores);

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
    it('deve retornar todos os scores ordenados por data', async () => {
      // Arrange
      const scores = [
        mockPrismaScore,
        { ...mockPrismaScore, id: 2, streamerId: 2 },
      ];
      mockPrismaService.score.findMany.mockResolvedValue(scores);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(mockPrismaService.score.findMany).toHaveBeenCalledWith({
        orderBy: { date: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('deve retornar array vazio quando não há scores', async () => {
      // Arrange
      mockPrismaService.score.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deve deletar um score', async () => {
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

  describe('toDomain', () => {
    it('deve converter dados do Prisma para entidade de domínio corretamente', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: 75,
        reason: 'Excelente interação com viewers',
      };
      mockPrismaService.score.create.mockResolvedValue({
        ...mockPrismaScore,
        points: 75,
      });

      // Act
      const result = await repository.create(scoreData);

      // Assert
      expect(result.id).toBe(1);
      expect(result.streamerId).toBe(1);
      expect(result.points).toBe(75);
      expect(result.reason).toBe('Excelente interação com viewers');
      expect(result.createdAt).toEqual(new Date('2024-01-01T10:30:00Z'));
    });

    it('deve usar reason padrão quando buscar por ID', async () => {
      // Arrange
      mockPrismaService.score.findUnique.mockResolvedValue(mockPrismaScore);

      // Act
      const result = await repository.findById(1);

      // Assert
      expect(result!.reason).toBe('Score record');
    });
  });
});
