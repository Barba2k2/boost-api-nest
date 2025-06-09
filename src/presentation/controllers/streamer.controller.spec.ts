import { GetAllStreamersUseCase } from '@application/use-cases/streamer/get-all-streamers.use-case';
import { GetOnlineStreamersUseCase } from '@application/use-cases/streamer/get-online-streamers.use-case';
import { UpdateMyStreamerUseCase } from '@application/use-cases/streamer/update-my-streamer.use-case';
import { UpdateStreamerOnlineStatusUseCase } from '@application/use-cases/streamer/update-streamer-online-status.use-case';
import { UpdateStreamerUseCase } from '@application/use-cases/streamer/update-streamer.use-case';
import { Streamer } from '@domain/entities/streamer.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { StreamerResponseDto } from '@presentation/dto/streamer/streamer-response.dto';
import { UpdateOnlineStatusDto } from '@presentation/dto/streamer/update-online-status.dto';
import { UpdateStreamerDto } from '@presentation/dto/streamer/update-streamer.dto';
import { RateLimitService } from '../../infrastructure/cache/rate-limit.service';
import { StreamerController } from './streamer.controller';

describe('StreamerController', () => {
  let controller: StreamerController;
  let mockGetAllStreamersUseCase: any;
  let mockGetOnlineStreamersUseCase: any;
  let mockUpdateStreamerUseCase: any;
  let mockUpdateStreamerOnlineStatusUseCase: any;
  let mockUpdateMyStreamerUseCase: any;

  const mockStreamer = new Streamer(
    1,
    123,
    100,
    ['Twitch', 'YouTube'],
    ['Monday', 'Tuesday'],
    false,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
    'meu_nick',
    '20:00',
    '00:00',
  );

  const mockStreamers = [
    mockStreamer,
    new Streamer(
      2,
      456,
      200,
      ['Kick'],
      ['Wednesday'],
      true,
      new Date('2024-01-02'),
      new Date('2024-01-02'),
      'outro_nick',
      '19:00',
      '23:00',
    ),
  ];

  beforeEach(async () => {
    mockGetAllStreamersUseCase = {
      execute: jest.fn(),
    };

    mockGetOnlineStreamersUseCase = {
      execute: jest.fn(),
    };

    mockUpdateStreamerUseCase = {
      execute: jest.fn(),
    };

    mockUpdateStreamerOnlineStatusUseCase = {
      execute: jest.fn(),
    };

    mockUpdateMyStreamerUseCase = {
      execute: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamerController],
      providers: [
        {
          provide: GetAllStreamersUseCase,
          useValue: mockGetAllStreamersUseCase,
        },
        {
          provide: GetOnlineStreamersUseCase,
          useValue: mockGetOnlineStreamersUseCase,
        },
        {
          provide: UpdateStreamerUseCase,
          useValue: mockUpdateStreamerUseCase,
        },
        {
          provide: UpdateStreamerOnlineStatusUseCase,
          useValue: mockUpdateStreamerOnlineStatusUseCase,
        },
        {
          provide: UpdateMyStreamerUseCase,
          useValue: mockUpdateMyStreamerUseCase,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: RateLimitService,
          useValue: {
            checkLoginRateLimit: jest.fn(),
            isTemporarilyBlocked: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            clearFailedAttempts: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<StreamerController>(StreamerController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar todos os streamers', async () => {
      // Arrange
      mockGetAllStreamersUseCase.execute.mockResolvedValue(mockStreamers);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockGetAllStreamersUseCase.execute).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StreamerResponseDto);
      expect(result[0].id).toBe(mockStreamers[0].id);
      expect(result[1].id).toBe(mockStreamers[1].id);
    });

    it('deve retornar array vazio quando não há streamers', async () => {
      // Arrange
      mockGetAllStreamersUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockGetAllStreamersUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('deve propagar erro do caso de uso', async () => {
      // Arrange
      const error = new Error('Erro ao buscar streamers');
      mockGetAllStreamersUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow(
        'Erro ao buscar streamers',
      );
      expect(mockGetAllStreamersUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('findOnline', () => {
    it('deve retornar streamers online', async () => {
      // Arrange
      const onlineStreamers = [mockStreamers[1]]; // Apenas o segundo está online
      mockGetOnlineStreamersUseCase.execute.mockResolvedValue(onlineStreamers);

      // Act
      const result = await controller.findOnline();

      // Assert
      expect(mockGetOnlineStreamersUseCase.execute).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StreamerResponseDto);
      expect(result[0].id).toBe(2);
      expect(result[0].isOnline).toBe(true);
    });

    it('deve retornar array vazio quando não há streamers online', async () => {
      // Arrange
      mockGetOnlineStreamersUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.findOnline();

      // Assert
      expect(mockGetOnlineStreamersUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('deve propagar erro do caso de uso', async () => {
      // Arrange
      const error = new Error('Erro ao buscar streamers online');
      mockGetOnlineStreamersUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findOnline()).rejects.toThrow(
        'Erro ao buscar streamers online',
      );
      expect(mockGetOnlineStreamersUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar streamer com sucesso', async () => {
      // Arrange
      const updateData: UpdateStreamerDto = {
        nickname: 'novo_nick',
        platforms: ['Twitch', 'YouTube', 'TikTok'],
        streamDays: ['Monday', 'Tuesday', 'Wednesday'],
        startTime: '19:00',
        endTime: '01:00',
      };

      const updatedStreamer = new Streamer(
        1,
        123,
        100,
        ['Twitch', 'YouTube', 'TikTok'],
        ['Monday', 'Tuesday', 'Wednesday'],
        false,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
        'novo_nick',
        '19:00',
        '01:00',
      );

      mockUpdateStreamerUseCase.execute.mockResolvedValue(updatedStreamer);

      // Act
      const result = await controller.update(1, updateData);

      // Assert
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        nickname: 'novo_nick',
        platforms: ['Twitch', 'YouTube', 'TikTok'],
        streamDays: ['Monday', 'Tuesday', 'Wednesday'],
        startTime: '19:00',
        endTime: '01:00',
      });

      expect(result).toBeInstanceOf(StreamerResponseDto);
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('novo_nick');
      expect(result.platforms).toEqual(['Twitch', 'YouTube', 'TikTok']);
    });

    it('deve propagar erro quando streamer não encontrado', async () => {
      // Arrange
      const updateData: UpdateStreamerDto = {
        nickname: 'novo_nick',
      };

      const error = new NotFoundException('Streamer com ID 999 não encontrado');
      mockUpdateStreamerUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.update(999, updateData)).rejects.toThrow(
        'Streamer com ID 999 não encontrado',
      );
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 999,
        nickname: 'novo_nick',
        platforms: undefined,
        streamDays: undefined,
        startTime: undefined,
        endTime: undefined,
      });
    });
  });

  describe('updateOnlineStatus', () => {
    it('deve atualizar status online com sucesso', async () => {
      // Arrange
      const updateStatusDto: UpdateOnlineStatusDto = {
        isOnline: true,
      };

      const updatedStreamer = new Streamer(
        1,
        123,
        100,
        ['Twitch', 'YouTube'],
        ['Monday', 'Tuesday'],
        true, // Agora online
        new Date('2024-01-01'),
        new Date('2024-01-01'),
        'meu_nick',
        '20:00',
        '00:00',
      );

      mockUpdateStreamerOnlineStatusUseCase.execute.mockResolvedValue(
        updatedStreamer,
      );

      // Act
      const result = await controller.updateOnlineStatus(1, updateStatusDto);

      // Assert
      expect(
        mockUpdateStreamerOnlineStatusUseCase.execute,
      ).toHaveBeenCalledWith({
        streamerId: 1,
        isOnline: true,
      });

      expect(result).toBeInstanceOf(StreamerResponseDto);
      expect(result.id).toBe(1);
      expect(result.isOnline).toBe(true);
    });

    it('deve propagar erro quando streamer não encontrado', async () => {
      // Arrange
      const updateStatusDto: UpdateOnlineStatusDto = {
        isOnline: false,
      };

      const error = new NotFoundException('Streamer não encontrado');
      mockUpdateStreamerOnlineStatusUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.updateOnlineStatus(999, updateStatusDto),
      ).rejects.toThrow('Streamer não encontrado');
      expect(
        mockUpdateStreamerOnlineStatusUseCase.execute,
      ).toHaveBeenCalledWith({
        streamerId: 999,
        isOnline: false,
      });
    });
  });
});
