import { STREAMER_REPOSITORY_TOKEN } from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  UpdateStreamerCommand,
  UpdateStreamerUseCase,
} from './update-streamer.use-case';

describe('UpdateStreamerUseCase', () => {
  let useCase: UpdateStreamerUseCase;
  let mockStreamerRepository: any;

  const existingStreamer = new Streamer(
    1,
    123,
    100,
    ['Twitch'],
    ['Monday', 'Tuesday'],
    false,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  const updatedStreamer = new Streamer(
    1,
    123,
    200,
    ['Twitch', 'YouTube'],
    ['Monday', 'Wednesday'],
    true,
    new Date('2024-01-01'),
    new Date('2024-01-02'),
  );

  beforeEach(async () => {
    mockStreamerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateStreamerUseCase,
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateStreamerUseCase>(UpdateStreamerUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve atualizar um streamer com todos os parâmetros fornecidos', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        points: 200,
        platforms: ['Twitch', 'YouTube'],
        streamDays: ['Monday', 'Wednesday'],
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(1);
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        points: 200,
        platforms: ['Twitch', 'YouTube'],
        streamDays: ['Monday', 'Wednesday'],
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar apenas os pontos quando apenas pontos são fornecidos', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        points: 150,
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(1);
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        points: 150,
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar apenas as plataformas quando apenas plataformas são fornecidas', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        platforms: ['Kick', 'Facebook Gaming'],
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(1);
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        platforms: ['Kick', 'Facebook Gaming'],
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar apenas os dias de stream quando apenas streamDays são fornecidos', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        streamDays: ['Friday', 'Saturday', 'Sunday'],
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(1);
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        streamDays: ['Friday', 'Saturday', 'Sunday'],
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve lançar NotFoundException quando streamer não existe', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 999,
        points: 200,
      };

      mockStreamerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        new NotFoundException('Streamer com ID 999 não encontrado'),
      );
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(999);
      expect(mockStreamerRepository.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando streamer é undefined', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 888,
        points: 100,
      };

      mockStreamerRepository.findById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        new NotFoundException('Streamer com ID 888 não encontrado'),
      );
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(888);
      expect(mockStreamerRepository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar com pontos negativos', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        points: -50,
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        points: -50,
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar com pontos zero', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        points: 0,
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        points: 0,
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar com arrays vazios', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        platforms: [],
        streamDays: [],
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        platforms: [],
        streamDays: [],
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve não incluir campos undefined no updateData', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        points: 100,
        // platforms e streamDays são undefined
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        points: 100,
        // Apenas points deve estar presente
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve propagar erro do repositório na busca', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        points: 200,
      };

      const error = new Error('Database connection failed');
      mockStreamerRepository.findById.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(1);
      expect(mockStreamerRepository.update).not.toHaveBeenCalled();
    });

    it('deve propagar erro do repositório na atualização', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        points: 200,
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);

      const error = new Error('Update failed');
      mockStreamerRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Update failed');
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(1);
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {
        points: 200,
      });
    });

    it('deve funcionar quando nenhum campo de atualização é fornecido', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        // Nenhum campo de atualização fornecido
      };

      mockStreamerRepository.findById.mockResolvedValue(existingStreamer);
      mockStreamerRepository.update.mockResolvedValue(existingStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.findById).toHaveBeenCalledWith(1);
      expect(mockStreamerRepository.update).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(existingStreamer);
    });
  });
});
