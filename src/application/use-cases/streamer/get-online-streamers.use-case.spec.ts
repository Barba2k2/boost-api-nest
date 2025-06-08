import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { GetOnlineStreamersUseCase } from './get-online-streamers.use-case';

describe('GetOnlineStreamersUseCase', () => {
  let useCase: GetOnlineStreamersUseCase;
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
        GetOnlineStreamersUseCase,
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetOnlineStreamersUseCase>(GetOnlineStreamersUseCase);
    streamerRepository = module.get(STREAMER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar lista de streamers online', async () => {
      // Arrange
      const onlineStreamer1 = new Streamer(
        1,
        1,
        100,
        ['twitch'],
        ['monday'],
        true, // isOnline = true
      );

      const onlineStreamer2 = new Streamer(
        2,
        2,
        200,
        ['youtube'],
        ['tuesday'],
        true, // isOnline = true
      );

      const mockOnlineStreamers = [onlineStreamer1, onlineStreamer2];

      streamerRepository.findOnlineStreamers.mockResolvedValue(
        mockOnlineStreamers,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(streamerRepository.findOnlineStreamers).toHaveBeenCalledWith();
      expect(result).toEqual(mockOnlineStreamers);
      expect(result).toHaveLength(2);
      expect(result[0].isOnline).toBe(true);
      expect(result[1].isOnline).toBe(true);
    });

    it('deve retornar lista vazia quando não há streamers online', async () => {
      // Arrange
      streamerRepository.findOnlineStreamers.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(streamerRepository.findOnlineStreamers).toHaveBeenCalledWith();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      const error = new Error('Database error');
      streamerRepository.findOnlineStreamers.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Database error');
      expect(streamerRepository.findOnlineStreamers).toHaveBeenCalledWith();
    });

    it('deve retornar apenas streamers com status online true', async () => {
      // Arrange
      const onlineStreamer = new Streamer(
        1,
        1,
        100,
        ['twitch'],
        ['monday'],
        true, // isOnline = true
      );

      streamerRepository.findOnlineStreamers.mockResolvedValue([
        onlineStreamer,
      ]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].isOnline).toBe(true);
      expect(result[0].id).toBe(1);
    });
  });
});
