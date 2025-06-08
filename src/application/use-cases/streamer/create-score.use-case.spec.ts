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
        points: 5,
        reason: 'Completou stream de 2 horas',
      };

      const expectedScore = new Score(
        1,
        1,
        5,
        'Completou stream de 2 horas',
        new Date(),
      );

      mockScoreRepository.create.mockResolvedValue(expectedScore);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(scoreRepository.create).toHaveBeenCalledWith({
        streamerId: 1,
        points: 5,
        reason: 'Completou stream de 2 horas',
      });
      expect(result).toBe(expectedScore);
    });

    it('deve propagar erro quando limite diário é excedido', async () => {
      // Arrange
      const command = {
        streamerId: 1,
        points: 50,
        reason: 'Tentativa de pontuação',
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
        points: -10,
        reason: 'Penalidade por cancelamento de stream',
      };

      const expectedScore = new Score(
        1,
        1,
        -10,
        'Penalidade por cancelamento de stream',
        new Date(),
      );

      mockScoreRepository.create.mockResolvedValue(expectedScore);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(scoreRepository.create).toHaveBeenCalledWith({
        streamerId: 1,
        points: -10,
        reason: 'Penalidade por cancelamento de stream',
      });
      expect(result).toBe(expectedScore);
      expect(result.points).toBe(-10);
    });
  });
});
