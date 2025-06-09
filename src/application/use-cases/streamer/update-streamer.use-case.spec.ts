import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
  UpdateStreamerData,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  UpdateStreamerCommand,
  UpdateStreamerUseCase,
} from './update-streamer.use-case';

describe('UpdateStreamerUseCase', () => {
  let useCase: UpdateStreamerUseCase;
  let streamerRepository: jest.Mocked<IStreamerRepository>;

  const mockStreamerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addPoints: jest.fn(),
    updateOnlineStatus: jest.fn(),
    findOnlineStreamers: jest.fn(),
  };

  beforeEach(async () => {
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
    streamerRepository = module.get(STREAMER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockStreamer = new Streamer(
      1,
      123,
      100,
      ['Twitch'],
      ['Monday', 'Wednesday'],
      false,
      new Date('2024-01-01'),
      new Date('2024-01-01'),
    );

    const updatedStreamer = new Streamer(
      1,
      123,
      100,
      ['Twitch', 'YouTube'],
      ['Monday', 'Wednesday', 'Friday'],
      false,
      new Date('2024-01-01'),
      new Date('2024-01-02'),
    );

    it('deve atualizar streamer quando existe', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        platforms: ['Twitch', 'YouTube'],
        streamDays: ['Monday', 'Wednesday', 'Friday'],
      };

      streamerRepository.findById.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.findById).toHaveBeenCalledWith(1);
      expect(streamerRepository.update).toHaveBeenCalledWith(1, {
        platforms: ['Twitch', 'YouTube'],
        streamDays: ['Monday', 'Wednesday', 'Friday'],
      });
      expect(result).toEqual(updatedStreamer);
    });

    it('deve lançar NotFoundException quando streamer não existe', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 999,
        platforms: ['Twitch'],
      };

      streamerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        new NotFoundException('Streamer com ID 999 não encontrado'),
      );

      expect(streamerRepository.findById).toHaveBeenCalledWith(999);
      expect(streamerRepository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar apenas nickname quando fornecido', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        nickname: 'new_nickname',
      };

      const expectedUpdateData: UpdateStreamerData = {
        nickname: 'new_nickname',
      };

      streamerRepository.findById.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(
        1,
        expectedUpdateData,
      );
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar apenas plataformas quando fornecidas', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        platforms: ['YouTube', 'Kick'],
      };

      const expectedUpdateData: UpdateStreamerData = {
        platforms: ['YouTube', 'Kick'],
      };

      streamerRepository.findById.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(
        1,
        expectedUpdateData,
      );
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar apenas dias de stream quando fornecidos', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        streamDays: ['Tuesday', 'Thursday', 'Saturday'],
      };

      const expectedUpdateData: UpdateStreamerData = {
        streamDays: ['Tuesday', 'Thursday', 'Saturday'],
      };

      streamerRepository.findById.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(
        1,
        expectedUpdateData,
      );
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar horários quando fornecidos', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        startTime: '20:00',
        endTime: '23:00',
      };

      const expectedUpdateData: UpdateStreamerData = {
        startTime: '20:00',
        endTime: '23:00',
      };

      streamerRepository.findById.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(
        1,
        expectedUpdateData,
      );
      expect(result).toEqual(updatedStreamer);
    });

    it('deve atualizar todos os campos quando fornecidos', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        nickname: 'complete_update',
        platforms: ['Twitch', 'YouTube', 'Kick'],
        streamDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '19:00',
        endTime: '24:00',
      };

      const expectedUpdateData: UpdateStreamerData = {
        nickname: 'complete_update',
        platforms: ['Twitch', 'YouTube', 'Kick'],
        streamDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '19:00',
        endTime: '24:00',
      };

      streamerRepository.findById.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(
        1,
        expectedUpdateData,
      );
      expect(result).toEqual(updatedStreamer);
    });

    it('deve funcionar com arrays vazios', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        platforms: [],
        streamDays: [],
      };

      const expectedUpdateData: UpdateStreamerData = {
        platforms: [],
        streamDays: [],
      };

      streamerRepository.findById.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(
        1,
        expectedUpdateData,
      );
      expect(result).toEqual(updatedStreamer);
    });

    it('deve não incluir campos undefined no updateData', async () => {
      // Arrange
      const command: UpdateStreamerCommand = {
        id: 1,
        platforms: ['Twitch'],
        // outros campos não definidos
      };

      const expectedUpdateData: UpdateStreamerData = {
        platforms: ['Twitch'],
      };

      streamerRepository.findById.mockResolvedValue(mockStreamer);
      streamerRepository.update.mockResolvedValue(updatedStreamer);

      // Act
      await useCase.execute(command);

      // Assert
      expect(streamerRepository.update).toHaveBeenCalledWith(
        1,
        expectedUpdateData,
      );
      // Verifica que campos undefined não estão no objeto
      expect(expectedUpdateData).not.toHaveProperty('nickname');
      expect(expectedUpdateData).not.toHaveProperty('streamDays');
      expect(expectedUpdateData).not.toHaveProperty('startTime');
      expect(expectedUpdateData).not.toHaveProperty('endTime');
    });
  });
});
