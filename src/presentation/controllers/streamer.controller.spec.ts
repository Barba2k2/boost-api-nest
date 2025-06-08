import { CreateStreamerUseCase } from '@application/use-cases/streamer/create-streamer.use-case';
import { GetAllStreamersUseCase } from '@application/use-cases/streamer/get-all-streamers.use-case';
import { GetOnlineStreamersUseCase } from '@application/use-cases/streamer/get-online-streamers.use-case';
import { UpdateStreamerOnlineStatusUseCase } from '@application/use-cases/streamer/update-streamer-online-status.use-case';
import { UpdateStreamerUseCase } from '@application/use-cases/streamer/update-streamer.use-case';
import { Streamer } from '@domain/entities/streamer.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateStreamerDto } from '@presentation/dto/streamer/create-streamer.dto';
import { StreamerResponseDto } from '@presentation/dto/streamer/streamer-response.dto';
import { UpdateOnlineStatusDto } from '@presentation/dto/streamer/update-online-status.dto';
import { StreamerController } from './streamer.controller';

describe('StreamerController', () => {
  let controller: StreamerController;
  let mockCreateStreamerUseCase: any;
  let mockGetAllStreamersUseCase: any;
  let mockGetOnlineStreamersUseCase: any;
  let mockUpdateStreamerUseCase: any;
  let mockUpdateStreamerOnlineStatusUseCase: any;

  const mockStreamer = new Streamer(
    1,
    123,
    100,
    ['Twitch', 'YouTube'],
    ['Monday', 'Tuesday'],
    false,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
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
    ),
  ];

  beforeEach(async () => {
    mockCreateStreamerUseCase = {
      execute: jest.fn(),
    };

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
          provide: CreateStreamerUseCase,
          useValue: mockCreateStreamerUseCase,
        },
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
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<StreamerController>(StreamerController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um streamer com sucesso', async () => {
      // Arrange
      const createStreamerDto: CreateStreamerDto = {
        userId: 123,
        points: 100,
        platforms: ['Twitch', 'YouTube'],
        streamDays: ['Monday', 'Tuesday'],
      };

      mockCreateStreamerUseCase.execute.mockResolvedValue(mockStreamer);

      // Act
      const result = await controller.create(createStreamerDto);

      // Assert
      expect(mockCreateStreamerUseCase.execute).toHaveBeenCalledWith({
        userId: 123,
        points: 100,
        platforms: ['Twitch', 'YouTube'],
        streamDays: ['Monday', 'Tuesday'],
      });

      expect(result).toBeInstanceOf(StreamerResponseDto);
      expect(result.id).toBe(mockStreamer.id);
      expect(result.userId).toBe(mockStreamer.userId);
      expect(result.points).toBe(mockStreamer.points);
      expect(result.platforms).toEqual(mockStreamer.platforms);
      expect(result.streamDays).toEqual(mockStreamer.streamDays);
    });

    it('deve criar um streamer com parâmetros opcionais', async () => {
      // Arrange
      const createStreamerDto: CreateStreamerDto = {
        userId: 456,
      };

      const simpleStreamer = new Streamer(2, 456, 0, [], []);
      mockCreateStreamerUseCase.execute.mockResolvedValue(simpleStreamer);

      // Act
      const result = await controller.create(createStreamerDto);

      // Assert
      expect(mockCreateStreamerUseCase.execute).toHaveBeenCalledWith({
        userId: 456,
        points: undefined,
        platforms: undefined,
        streamDays: undefined,
      });

      expect(result.userId).toBe(456);
      expect(result.id).toBe(2);
    });

    it('deve propagar erro do caso de uso', async () => {
      // Arrange
      const createStreamerDto: CreateStreamerDto = {
        userId: 123,
        points: 100,
      };

      const error = new Error('Erro na criação do streamer');
      mockCreateStreamerUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.create(createStreamerDto)).rejects.toThrow(
        'Erro na criação do streamer',
      );
      expect(mockCreateStreamerUseCase.execute).toHaveBeenCalledWith({
        userId: 123,
        points: 100,
        platforms: undefined,
        streamDays: undefined,
      });
    });

    it('deve criar streamer com arrays vazios', async () => {
      // Arrange
      const createStreamerDto: CreateStreamerDto = {
        userId: 789,
        points: 50,
        platforms: [],
        streamDays: [],
      };

      const emptyArraysStreamer = new Streamer(3, 789, 50, [], []);
      mockCreateStreamerUseCase.execute.mockResolvedValue(emptyArraysStreamer);

      // Act
      const result = await controller.create(createStreamerDto);

      // Assert
      expect(mockCreateStreamerUseCase.execute).toHaveBeenCalledWith({
        userId: 789,
        points: 50,
        platforms: [],
        streamDays: [],
      });

      expect(result.platforms).toEqual([]);
      expect(result.streamDays).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os streamers', async () => {
      // Arrange
      mockGetAllStreamersUseCase.execute.mockResolvedValue(mockStreamers);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockGetAllStreamersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetAllStreamersUseCase.execute).toHaveBeenCalledWith();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StreamerResponseDto);
      expect(result[1]).toBeInstanceOf(StreamerResponseDto);

      expect(result[0].id).toBe(mockStreamers[0].id);
      expect(result[1].id).toBe(mockStreamers[1].id);
    });

    it('deve retornar array vazio quando não há streamers', async () => {
      // Arrange
      mockGetAllStreamersUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockGetAllStreamersUseCase.execute).toHaveBeenCalledTimes(1);
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
      expect(mockGetAllStreamersUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('deve mapear corretamente múltiplos streamers', async () => {
      // Arrange
      const multipleStreamers = [
        new Streamer(1, 111, 100, ['Twitch'], ['Monday']),
        new Streamer(2, 222, 200, ['YouTube'], ['Tuesday']),
        new Streamer(3, 333, 300, ['Kick'], ['Wednesday']),
      ];
      mockGetAllStreamersUseCase.execute.mockResolvedValue(multipleStreamers);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toHaveLength(3);

      expect(result[0].userId).toBe(111);
      expect(result[0].points).toBe(100);
      expect(result[0].platforms).toEqual(['Twitch']);

      expect(result[1].userId).toBe(222);
      expect(result[1].points).toBe(200);
      expect(result[1].platforms).toEqual(['YouTube']);

      expect(result[2].userId).toBe(333);
      expect(result[2].points).toBe(300);
      expect(result[2].platforms).toEqual(['Kick']);
    });
  });

  describe('findOnline', () => {
    it('deve retornar streamers online', async () => {
      // Arrange
      const onlineStreamers = [mockStreamers[1]]; // Apenas o que tem isOnline = true
      mockGetOnlineStreamersUseCase.execute.mockResolvedValue(onlineStreamers);

      // Act
      const result = await controller.findOnline();

      // Assert
      expect(mockGetOnlineStreamersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockGetOnlineStreamersUseCase.execute).toHaveBeenCalledWith();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(StreamerResponseDto);
      expect(result[0].id).toBe(mockStreamers[1].id);
      expect(result[0].isOnline).toBe(true);
    });

    it('deve retornar array vazio quando não há streamers online', async () => {
      // Arrange
      mockGetOnlineStreamersUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.findOnline();

      // Assert
      expect(mockGetOnlineStreamersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('deve atualizar um streamer com sucesso', async () => {
      // Arrange
      const updateData = {
        points: 150,
        platforms: ['Twitch'],
      };

      const updatedStreamer = new Streamer(
        1,
        123,
        150,
        ['Twitch'],
        ['Monday', 'Tuesday'],
        false,
      );

      mockUpdateStreamerUseCase.execute.mockResolvedValue(updatedStreamer);

      // Act
      const result = await controller.update(1, updateData);

      // Assert
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        points: 150,
        platforms: ['Twitch'],
        streamDays: undefined,
      });

      expect(result).toBeInstanceOf(StreamerResponseDto);
      expect(result.id).toBe(1);
      expect(result.points).toBe(150);
      expect(result.platforms).toEqual(['Twitch']);
    });

    it('deve propagar NotFoundException quando streamer não existe', async () => {
      // Arrange
      const updateData = { points: 150 };
      const error = new NotFoundException('Streamer não encontrado');
      mockUpdateStreamerUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.update(999, updateData)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 999,
        points: 150,
        platforms: undefined,
        streamDays: undefined,
      });
    });
  });

  describe('updateOnlineStatus', () => {
    it('deve atualizar status online para true', async () => {
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
        true, // isOnline = true
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

    it('deve atualizar status online para false', async () => {
      // Arrange
      const updateStatusDto: UpdateOnlineStatusDto = {
        isOnline: false,
      };

      const updatedStreamer = new Streamer(
        1,
        123,
        100,
        ['Twitch', 'YouTube'],
        ['Monday', 'Tuesday'],
        false, // isOnline = false
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
        isOnline: false,
      });

      expect(result).toBeInstanceOf(StreamerResponseDto);
      expect(result.id).toBe(1);
      expect(result.isOnline).toBe(false);
    });

    it('deve propagar NotFoundException quando streamer não existe', async () => {
      // Arrange
      const updateStatusDto: UpdateOnlineStatusDto = {
        isOnline: true,
      };

      const error = new NotFoundException('Streamer não encontrado');
      mockUpdateStreamerOnlineStatusUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.updateOnlineStatus(999, updateStatusDto),
      ).rejects.toThrow(NotFoundException);

      expect(
        mockUpdateStreamerOnlineStatusUseCase.execute,
      ).toHaveBeenCalledWith({
        streamerId: 999,
        isOnline: true,
      });
    });
  });
});
