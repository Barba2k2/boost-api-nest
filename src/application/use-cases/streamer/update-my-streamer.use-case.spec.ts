import { Streamer } from '@domain/entities/streamer.entity';
import { User, UserRole } from '@domain/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '../../ports/repositories/streamer.repository.interface';
import {
  UpdateMyStreamerCommand,
  UpdateMyStreamerUseCase,
} from './update-my-streamer.use-case';

describe('UpdateMyStreamerUseCase', () => {
  let useCase: UpdateMyStreamerUseCase;
  let streamerRepository: jest.Mocked<IStreamerRepository>;

  const mockStreamerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOnlineStreamers: jest.fn(),
    updateOnlineStatus: jest.fn(),
  };

  const mockUser = new User(
    1,
    'testuser',
    'hashedpassword',
    UserRole.USER,
    'test@example.com',
    'Test User',
    true,
  );

  const mockStreamer = new Streamer(
    1,
    1,
    0,
    ['twitch'],
    ['monday', 'wednesday', 'friday'],
    false,
    new Date(),
    new Date(),
    'testuser',
    '20:00',
    '23:00',
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateMyStreamerUseCase,
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateMyStreamerUseCase>(UpdateMyStreamerUseCase);
    streamerRepository = module.get(STREAMER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: UpdateMyStreamerCommand = {
      userId: 1,
      platforms: ['twitch', 'youtube'],
      streamDays: ['monday', 'tuesday', 'wednesday'],
      startTime: '19:00',
      endTime: '22:00',
    };

    const updatedStreamer = new Streamer(
      1,
      1,
      0,
      ['twitch', 'youtube'],
      ['monday', 'tuesday', 'wednesday'],
      false,
      new Date(),
      new Date(),
      'testuser',
      '19:00',
      '22:00',
    );

    it('deve atualizar streamer com sucesso', async () => {
      // Arrange
      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(
        validCommand.userId,
      );
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        platforms: validCommand.platforms,
        streamDays: validCommand.streamDays,
        startTime: validCommand.startTime,
        endTime: validCommand.endTime,
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve lançar NotFoundException quando streamer não existe', async () => {
      // Arrange
      streamerRepository.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Perfil de streamer não encontrado para este usuário',
      );

      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(
        validCommand.userId,
      );
      expect(streamerRepository.update).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando nenhum dado é fornecido', async () => {
      // Arrange
      const emptyCommand: UpdateMyStreamerCommand = {
        userId: 1,
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);

      // Act & Assert
      await expect(useCase.execute(emptyCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(emptyCommand)).rejects.toThrow(
        'Nenhum dado fornecido para atualização',
      );

      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(
        emptyCommand.userId,
      );
      expect(streamerRepository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar apenas plataformas quando fornecidas', async () => {
      // Arrange
      const platformsOnlyCommand: UpdateMyStreamerCommand = {
        userId: 1,
        platforms: ['youtube'],
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(platformsOnlyCommand);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        platforms: ['youtube'],
      });
    });

    it('deve atualizar apenas dias de stream quando fornecidos', async () => {
      // Arrange
      const streamDaysOnlyCommand: UpdateMyStreamerCommand = {
        userId: 1,
        streamDays: ['saturday', 'sunday'],
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(streamDaysOnlyCommand);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        streamDays: ['saturday', 'sunday'],
      });
    });

    it('deve atualizar apenas horário de início quando fornecido', async () => {
      // Arrange
      const startTimeOnlyCommand: UpdateMyStreamerCommand = {
        userId: 1,
        startTime: '18:00',
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(startTimeOnlyCommand);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        startTime: '18:00',
      });
    });

    it('deve atualizar apenas horário de fim quando fornecido', async () => {
      // Arrange
      const endTimeOnlyCommand: UpdateMyStreamerCommand = {
        userId: 1,
        endTime: '01:00',
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(endTimeOnlyCommand);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        endTime: '01:00',
      });
    });

    it('deve permitir arrays vazios para plataformas e dias de stream', async () => {
      // Arrange
      const emptyArraysCommand: UpdateMyStreamerCommand = {
        userId: 1,
        platforms: [],
        streamDays: [],
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(emptyArraysCommand);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        platforms: [],
        streamDays: [],
      });
    });

    it('deve propagar erros do repositório', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('deve lidar com múltiplas plataformas', async () => {
      // Arrange
      const multiPlatformCommand: UpdateMyStreamerCommand = {
        userId: 1,
        platforms: ['twitch', 'youtube', 'tiktok', 'instagram'],
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(multiPlatformCommand);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        platforms: ['twitch', 'youtube', 'tiktok', 'instagram'],
      });
    });

    it('deve lidar com todos os dias da semana', async () => {
      // Arrange
      const allDaysCommand: UpdateMyStreamerCommand = {
        userId: 1,
        streamDays: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(allDaysCommand);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        streamDays: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      });
    });

    it('deve lidar com horários 24h', async () => {
      // Arrange
      const fullDayCommand: UpdateMyStreamerCommand = {
        userId: 1,
        startTime: '00:00',
        endTime: '23:59',
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(fullDayCommand);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(mockStreamer.id, {
        startTime: '00:00',
        endTime: '23:59',
      });
    });
  });
});
