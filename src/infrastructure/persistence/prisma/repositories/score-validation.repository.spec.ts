import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ScoreValidationRepository } from './score-validation.repository';

describe('ScoreValidationRepository', () => {
  let repository: ScoreValidationRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    score: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreValidationRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ScoreValidationRepository>(
      ScoreValidationRepository,
    );
    prismaService = module.get(PrismaService);

    // Mock Date.now para tornar testes previsíveis
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T10:30:00Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('validateScoreCreation', () => {
    it('deve validar com sucesso quando não há problemas', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T10:30:00Z');
      const hour = 10;
      const points = 5;

      // Mock para duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValue([]);

      // Mock para limites por hora e diário
      mockPrismaService.score.aggregate
        .mockResolvedValueOnce({ _sum: { points: 5 } }) // Limite por hora
        .mockResolvedValueOnce({ _sum: { points: 100 } }); // Limite diário

      // Act & Assert
      await expect(
        repository.validateScoreCreation(streamerId, date, hour, points),
      ).resolves.toBeUndefined();
    });

    it('deve lançar erro quando há score duplicado nos últimos 6 minutos', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T10:30:00Z');
      const hour = 10;
      const points = 5;

      // Mock score criado há 3 minutos
      const recentScore = {
        id: 1,
        streamerId: 1,
        date: new Date('2024-01-01T10:27:00Z'),
        points: 5,
      };
      mockPrismaService.score.findMany.mockResolvedValue([recentScore]);

      // Act & Assert
      await expect(
        repository.validateScoreCreation(streamerId, date, hour, points),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro quando excede limite por hora', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T10:30:00Z');
      const hour = 10;
      const points = 5;

      // Mock para duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValue([]);

      // Mock limite por hora já em 8 pontos (total seria 13, excedendo 10)
      mockPrismaService.score.aggregate.mockResolvedValueOnce({
        _sum: { points: 8 },
      });

      // Act & Assert
      await expect(
        repository.validateScoreCreation(streamerId, date, hour, points),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro quando excede limite diário', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T10:30:00Z');
      const hour = 10;
      const points = 50;

      // Mock para duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValue([]);

      // Mock limites
      mockPrismaService.score.aggregate
        .mockResolvedValueOnce({ _sum: { points: 5 } }) // Limite por hora OK
        .mockResolvedValueOnce({ _sum: { points: 200 } }); // Limite diário seria 250, excedendo 240

      // Act & Assert
      await expect(
        repository.validateScoreCreation(streamerId, date, hour, points),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve permitir pontos negativos sem validar limites', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T10:30:00Z');
      const hour = 10;
      const points = -10;

      // Mock para duplicação (sem scores recentes)
      mockPrismaService.score.findMany.mockResolvedValue([]);

      // Act & Assert
      await expect(
        repository.validateScoreCreation(streamerId, date, hour, points),
      ).resolves.toBeUndefined();

      // Verificar que apenas a validação de duplicação foi chamada
      expect(mockPrismaService.score.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.score.aggregate).not.toHaveBeenCalled();
    });
  });

  describe('getDailyPointsByStreamerAndDate', () => {
    it('deve retornar pontos do dia corretamente', async () => {
      // Arrange
      const streamerId = 1;
      const date = new Date('2024-01-01T15:30:00Z');

      mockPrismaService.score.aggregate.mockResolvedValue({
        _sum: { points: 200 },
      });

      // Act
      const result = await repository.getDailyPointsByStreamerAndDate(
        streamerId,
        date,
      );

      // Assert
      expect(mockPrismaService.score.aggregate).toHaveBeenCalledWith({
        where: {
          streamerId,
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
      expect(result).toBe(200);
    });

    it('deve retornar 0 quando não há pontos', async () => {
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
  });
});
