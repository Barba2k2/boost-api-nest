import { STREAMER_REPOSITORY_TOKEN } from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateStreamerCommand,
  CreateStreamerUseCase,
} from './create-streamer.use-case';

describe('CreateStreamerUseCase', () => {
  let useCase: CreateStreamerUseCase;
  let mockStreamerRepository: any;

  const mockStreamer = new Streamer(
    1,
    123,
    100,
    ['Twitch', 'YouTube'],
    ['Monday', 'Tuesday'],
    new Date('2024-01-01'),
    new Date('2024-01-01'),
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
        CreateStreamerUseCase,
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateStreamerUseCase>(CreateStreamerUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve criar um streamer com todos os parâmetros fornecidos', async () => {
      // Arrange
      const command: CreateStreamerCommand = {
        userId: 123,
        points: 100,
        platforms: ['Twitch', 'YouTube'],
        streamDays: ['Monday', 'Tuesday'],
      };

      mockStreamerRepository.create.mockResolvedValue(mockStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.create).toHaveBeenCalledWith({
        userId: 123,
        points: 100,
        platforms: ['Twitch', 'YouTube'],
        streamDays: ['Monday', 'Tuesday'],
      });
      expect(result).toEqual(mockStreamer);
    });

    it('deve criar um streamer com valores padrão quando parâmetros opcionais não são fornecidos', async () => {
      // Arrange
      const command: CreateStreamerCommand = {
        userId: 456,
      };

      const expectedStreamerData = {
        userId: 456,
        points: 0,
        platforms: [],
        streamDays: [],
      };

      mockStreamerRepository.create.mockResolvedValue(mockStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.create).toHaveBeenCalledWith(
        expectedStreamerData,
      );
      expect(result).toEqual(mockStreamer);
    });

    it('deve criar um streamer apenas com pontos especificados', async () => {
      // Arrange
      const command: CreateStreamerCommand = {
        userId: 789,
        points: 250,
      };

      const expectedStreamerData = {
        userId: 789,
        points: 250,
        platforms: [],
        streamDays: [],
      };

      mockStreamerRepository.create.mockResolvedValue(mockStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.create).toHaveBeenCalledWith(
        expectedStreamerData,
      );
      expect(result).toEqual(mockStreamer);
    });

    it('deve criar um streamer apenas com plataformas especificadas', async () => {
      // Arrange
      const command: CreateStreamerCommand = {
        userId: 321,
        platforms: ['Kick', 'Facebook Gaming'],
      };

      const expectedStreamerData = {
        userId: 321,
        points: 0,
        platforms: ['Kick', 'Facebook Gaming'],
        streamDays: [],
      };

      mockStreamerRepository.create.mockResolvedValue(mockStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.create).toHaveBeenCalledWith(
        expectedStreamerData,
      );
      expect(result).toEqual(mockStreamer);
    });

    it('deve criar um streamer apenas com dias de stream especificados', async () => {
      // Arrange
      const command: CreateStreamerCommand = {
        userId: 654,
        streamDays: ['Friday', 'Saturday', 'Sunday'],
      };

      const expectedStreamerData = {
        userId: 654,
        points: 0,
        platforms: [],
        streamDays: ['Friday', 'Saturday', 'Sunday'],
      };

      mockStreamerRepository.create.mockResolvedValue(mockStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.create).toHaveBeenCalledWith(
        expectedStreamerData,
      );
      expect(result).toEqual(mockStreamer);
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      const command: CreateStreamerCommand = {
        userId: 999,
      };

      const error = new Error('Database connection failed');
      mockStreamerRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockStreamerRepository.create).toHaveBeenCalledWith({
        userId: 999,
        points: 0,
        platforms: [],
        streamDays: [],
      });
    });

    it('deve lidar com arrays vazios explicitamente fornecidos', async () => {
      // Arrange
      const command: CreateStreamerCommand = {
        userId: 111,
        points: 0,
        platforms: [],
        streamDays: [],
      };

      const expectedStreamerData = {
        userId: 111,
        points: 0,
        platforms: [],
        streamDays: [],
      };

      mockStreamerRepository.create.mockResolvedValue(mockStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.create).toHaveBeenCalledWith(
        expectedStreamerData,
      );
      expect(result).toEqual(mockStreamer);
    });

    it('deve lidar com pontos negativos', async () => {
      // Arrange
      const command: CreateStreamerCommand = {
        userId: 222,
        points: -50,
      };

      const expectedStreamerData = {
        userId: 222,
        points: -50,
        platforms: [],
        streamDays: [],
      };

      mockStreamerRepository.create.mockResolvedValue(mockStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockStreamerRepository.create).toHaveBeenCalledWith(
        expectedStreamerData,
      );
      expect(result).toEqual(mockStreamer);
    });
  });
});
