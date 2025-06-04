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
    points: 5,
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
    it('deve criar um score com sucesso quando não excede o limite diário', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: 5,
        reason: 'Boa performance na stream',
      };

      // Mock para validação de duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValueOnce([]);

      // Mock do método getDailyPointsByStreamerAndDate retornando 10 pontos
      mockPrismaService.score.aggregate.mockResolvedValueOnce({
        _sum: { points: 10 },
      });

      mockPrismaService.score.create.mockResolvedValue(mockPrismaScore);

      // Act
      const result = await repository.create(scoreData);

      // Assert
      expect(mockPrismaService.score.findMany).toHaveBeenCalledWith({
        where: {
          streamerId: 1,
          date: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 1,
      });

      expect(mockPrismaService.score.aggregate).toHaveBeenCalledWith({
        where: {
          streamerId: 1,
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          points: {
            gt: 0,
          },
        },
        _sum: { points: true },
      });

      expect(mockPrismaService.score.create).toHaveBeenCalledWith({
        data: {
          streamerId: 1,
          date: new Date('2024-01-01T10:30:00Z'),
          hour: 7, // UTC -3 (timezone local)
          minute: 30,
          points: 5,
        },
      });

      expect(result.points).toBe(5);
    });

    it('deve lançar erro quando excede o limite diário de 240 pontos', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: 50,
        reason: 'Tentativa de pontuação',
      };

      // Mock para validação de duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValueOnce([]);

      // Mock retornando 200 pontos já acumulados no dia
      mockPrismaService.score.aggregate.mockResolvedValueOnce({
        _sum: { points: 200 },
      });

      // Act & Assert
      await expect(repository.create(scoreData)).rejects.toThrow(
        'Limite diário de 240 pontos excedido',
      );

      expect(mockPrismaService.score.create).not.toHaveBeenCalled();
    });

    it('deve permitir pontos negativos sem validar limite', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: -10,
        reason: 'Penalidade por cancelamento',
      };

      // Mock para validação de duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValueOnce([]);

      const negativeScore = { ...mockPrismaScore, points: -10 };
      mockPrismaService.score.create.mockResolvedValue(negativeScore);

      // Act
      const result = await repository.create(scoreData);

      // Assert
      expect(mockPrismaService.score.findMany).toHaveBeenCalledWith({
        where: {
          streamerId: 1,
          date: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 1,
      });
      expect(mockPrismaService.score.aggregate).not.toHaveBeenCalled();
      expect(mockPrismaService.score.create).toHaveBeenCalledWith({
        data: {
          streamerId: 1,
          date: new Date('2024-01-01T10:30:00Z'),
          hour: 7,
          minute: 30,
          points: -10,
        },
      });
      expect(result.points).toBe(-10);
    });

    it('deve permitir exatamente 240 pontos quando não há pontos acumulados', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: 240,
        reason: 'Pontuação máxima diária',
      };

      // Mock retornando 0 pontos acumulados
      mockPrismaService.score.aggregate.mockResolvedValueOnce({
        _sum: { points: 0 },
      });

      // Mock para validação de duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValueOnce([]);

      const maxScore = { ...mockPrismaScore, points: 240 };
      mockPrismaService.score.create.mockResolvedValue(maxScore);

      // Act
      const result = await repository.create(scoreData);

      // Assert
      expect(result.points).toBe(240);
      expect(mockPrismaService.score.create).toHaveBeenCalled();
    });

    it('deve lançar erro quando tenta criar score duplicado em menos de 6 minutos', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: 5,
        reason: 'Tentativa de score duplicado',
      };

      // Mock retornando score criado há 3 minutos
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
      mockPrismaService.score.findMany.mockResolvedValueOnce([
        {
          id: 1,
          streamerId: 1,
          date: threeMinutesAgo,
          points: 5,
        },
      ]);

      // Act & Assert
      await expect(repository.create(scoreData)).rejects.toThrow(
        'Score duplicado detectado',
      );

      expect(mockPrismaService.score.create).not.toHaveBeenCalled();
    });

    it('deve permitir criar score quando último foi criado há mais de 6 minutos', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: 5,
        reason: 'Score válido após 6 minutos',
      };

      // Mock para validação de duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValueOnce([]);

      // Mock retornando 5 pontos acumulados no dia
      mockPrismaService.score.aggregate.mockResolvedValueOnce({
        _sum: { points: 5 },
      });

      mockPrismaService.score.create.mockResolvedValue(mockPrismaScore);

      // Act
      const result = await repository.create(scoreData);

      // Assert
      expect(result.points).toBe(5);
      expect(mockPrismaService.score.create).toHaveBeenCalled();
    });

    it('deve validar duplicação antes de validar limite diário', async () => {
      // Arrange
      const scoreData = {
        streamerId: 1,
        points: 5,
        reason: 'Teste ordem de validação',
      };

      // Mock retornando score criado há 2 minutos (duplicação)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      mockPrismaService.score.findMany.mockResolvedValueOnce([
        {
          id: 1,
          streamerId: 1,
          date: twoMinutesAgo,
          points: 5,
        },
      ]);

      // Act & Assert
      await expect(repository.create(scoreData)).rejects.toThrow(
        'Score duplicado detectado',
      );

      // Verificar que a validação de limite diário não foi chamada
      expect(mockPrismaService.score.aggregate).not.toHaveBeenCalled();
      expect(mockPrismaService.score.create).not.toHaveBeenCalled();
    });
  });

  describe('getDailyPointsByStreamerAndDate', () => {
    it('deve retornar pontos acumulados para uma data específica', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T15:30:00Z');

      mockPrismaService.score.aggregate.mockResolvedValue({
        _sum: { points: 12 },
      });

      // Act
      const result = await repository.getDailyPointsByStreamerAndDate(
        streamerId,
        date,
      );

      // Assert
      expect(mockPrismaService.score.aggregate).toHaveBeenCalledWith({
        where: {
          streamerId: 1,
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          points: {
            gt: 0,
          },
        },
        _sum: { points: true },
      });

      expect(result).toBe(12);
    });

    it('deve retornar 0 quando não há pontos no dia', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T15:30:00Z');

      mockPrismaService.score.aggregate.mockResolvedValue({
        _sum: { points: null },
      });

      // Act
      const result = await repository.getDailyPointsByStreamerAndDate(
        streamerId,
        date,
      );

      // Assert
      expect(result).toBe(0);
    });

    it('deve considerar apenas pontos positivos no cálculo diário', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T15:30:00Z');

      mockPrismaService.score.aggregate.mockResolvedValue({
        _sum: { points: 8 },
      });

      // Act
      const result = await repository.getDailyPointsByStreamerAndDate(
        streamerId,
        date,
      );

      // Assert
      expect(mockPrismaService.score.aggregate).toHaveBeenCalledWith({
        where: {
          streamerId: 1,
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          points: {
            gt: 0, // Verifica que só considera pontos positivos
          },
        },
        _sum: { points: true },
      });

      expect(result).toBe(8);
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
    it('deve retornar todos os scores', async () => {
      // Arrange
      const scores = [mockPrismaScore];
      mockPrismaService.score.findMany.mockResolvedValue(scores);

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
});
