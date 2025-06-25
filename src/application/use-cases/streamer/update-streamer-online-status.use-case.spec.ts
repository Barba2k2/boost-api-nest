import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { Test, TestingModule } from '@nestjs/testing';
import {
  UpdateStreamerOnlineStatusCommand,
  UpdateStreamerOnlineStatusUseCase,
} from './update-streamer-online-status.use-case';

describe('UpdateStreamerOnlineStatusUseCase', () => {
  let useCase: UpdateStreamerOnlineStatusUseCase;
  let streamerRepository: jest.Mocked<IStreamerRepository>;

  const mockStreamerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    updateOnlineStatus: jest.fn(),
    findOnlineStreamers: jest.fn(),
    findAll: jest.fn(),
    existsById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateStreamerOnlineStatusUseCase,
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateStreamerOnlineStatusUseCase>(
      UpdateStreamerOnlineStatusUseCase,
    );
    streamerRepository = module.get(STREAMER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve atualizar o status online do streamer para true', async () => {
      // Arrange
      const command: UpdateStreamerOnlineStatusCommand = {
        streamerId: 1,
        isOnline: true,
      };

      const existingStreamer = new Streamer(
        1,
        1,
        100,
        ['twitch'],
        ['monday'],
        false,
      );

      const updatedStreamer = new Streamer(
        1,
        1,
        100,
        ['twitch'],
        ['monday'],
        true, // isOnline = true
      );

      streamerRepository.findById.mockResolvedValue(existingStreamer);
      streamerRepository.updateOnlineStatus.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.findById).toHaveBeenCalledWith(1);
      expect(streamerRepository.updateOnlineStatus).toHaveBeenCalledWith(
        1,
        true,
      );
      expect(result).toBe(updatedStreamer);
      expect(result.isOnline).toBe(true);
    });

    it('deve atualizar o status online do streamer para false', async () => {
      // Arrange
      const command: UpdateStreamerOnlineStatusCommand = {
        streamerId: 2,
        isOnline: false,
      };

      const existingStreamer = new Streamer(
        2,
        2,
        50,
        ['youtube'],
        ['tuesday'],
        false,
      );

      const updatedStreamer = new Streamer(
        2,
        2,
        50,
        ['youtube'],
        ['tuesday'],
        false, // isOnline = false
      );

      streamerRepository.findById.mockResolvedValue(existingStreamer);
      streamerRepository.updateOnlineStatus.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.findById).toHaveBeenCalledWith(2);
      expect(streamerRepository.updateOnlineStatus).toHaveBeenCalledWith(
        2,
        false,
      );
      expect(result).toBe(updatedStreamer);
      expect(result.isOnline).toBe(false);
    });

    it('deve lançar NotFoundException quando streamer não existe', async () => {
      // Arrange
      const command: UpdateStreamerOnlineStatusCommand = {
        streamerId: 999,
        isOnline: true,
      };

      streamerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Streamer não encontrado',
      );
      expect(streamerRepository.findById).toHaveBeenCalledWith(999);
      expect(streamerRepository.updateOnlineStatus).not.toHaveBeenCalled();
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      const command: UpdateStreamerOnlineStatusCommand = {
        streamerId: 1,
        isOnline: true,
      };

      const existingStreamer = new Streamer(
        1,
        1,
        100,
        ['twitch'],
        ['monday'],
        false,
      );

      streamerRepository.findById.mockResolvedValue(existingStreamer);
      streamerRepository.updateOnlineStatus.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Database error');
      expect(streamerRepository.findById).toHaveBeenCalledWith(1);
      expect(streamerRepository.updateOnlineStatus).toHaveBeenCalledWith(
        1,
        true,
      );
    });

    it('deve funcionar com diferentes IDs de streamer', async () => {
      // Arrange
      const command: UpdateStreamerOnlineStatusCommand = {
        streamerId: 999,
        isOnline: true,
      };

      const existingStreamer = new Streamer(
        999,
        999,
        200,
        ['discord'],
        ['friday'],
        false,
      );

      const updatedStreamer = new Streamer(
        999,
        999,
        200,
        ['discord'],
        ['friday'],
        true, // isOnline = true
      );

      streamerRepository.findById.mockResolvedValue(existingStreamer);
      streamerRepository.updateOnlineStatus.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.findById).toHaveBeenCalledWith(999);
      expect(streamerRepository.updateOnlineStatus).toHaveBeenCalledWith(
        999,
        true,
      );
      expect(result.id).toBe(999);
      expect(streamerRepository.updateOnlineStatus).toHaveBeenCalledWith(
        999,
        true,
      );
      expect(result.id).toBe(999);
      expect(result.isOnline).toBe(true);
    });
  });
});
