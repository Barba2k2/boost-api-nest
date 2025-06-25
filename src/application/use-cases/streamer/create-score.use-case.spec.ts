import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
} from '@application/ports/repositories/score.repository.interface';
import { Score } from '@domain/entities/score.entity';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateScoreUseCase } from './create-score.use-case';

describe('CreateScoreUseCase', () => {
  let useCase: CreateScoreUseCase;
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
        CreateScoreUseCase,
        {
          provide: SCORE_REPOSITORY_TOKEN,
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateScoreUseCase>(CreateScoreUseCase);
    scoreRepository = module.get(SCORE_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve criar um score com sucesso', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        date: new Date('2025-04-29T00:00:00Z'),
        hour: 18,
        minute: 50,
        points: 1,
      };

      const expectedScore = new Score(
        1,
        1,
        1,
        new Date('2025-04-29T18:50:00Z'),
      );

      mockScoreRepository.create.mockResolvedValue(expectedScore);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(scoreRepository.create).toHaveBeenCalledWith({
        streamerId: 1,
        date: new Date('2025-04-29T00:00:00Z'),
        hour: 18,
        minute: 50,
        points: 1,
      });
      expect(result).toBe(expectedScore);
    });

    it('deve propagar erro quando limite diário é excedido', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        date: new Date('2025-04-29T00:00:00Z'),
        hour: 18,
        minute: 50,
        points: 50,
      };

      const error = new BadRequestException(
        'Limite diário de 240 pontos excedido. Pontos atuais do dia: 200. Pontos restantes: 40.',
      );

      mockScoreRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(command)).rejects.toThrow(
        'Limite diário de 240 pontos excedido. Pontos atuais do dia: 200. Pontos restantes: 40.',
      );
    });

    it('deve permitir pontos negativos sem validação', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        date: new Date('2025-04-29T00:00:00Z'),
        hour: 18,
        minute: 50,
        points: -10,
      };

      const expectedScore = new Score(
        1,
        1,
        -10,
        new Date('2025-04-29T18:50:00Z'),
      );

      mockScoreRepository.create.mockResolvedValue(expectedScore);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(scoreRepository.create).toHaveBeenCalledWith({
        streamerId: 1,
        date: new Date('2025-04-29T00:00:00Z'),
        hour: 18,
        minute: 50,
        points: -10,
      });
      expect(result).toBe(expectedScore);
      expect(result.points).toBe(-10);
    });
  });
});
