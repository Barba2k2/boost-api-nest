import { CreateStreamerUseCase } from '@application/use-cases/streamer/create-streamer.use-case';
import { GetAllStreamersUseCase } from '@application/use-cases/streamer/get-all-streamers.use-case';
import { UpdateStreamerUseCase } from '@application/use-cases/streamer/update-streamer.use-case';
import { Streamer } from '@domain/entities/streamer.entity';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateStreamerDto } from '@presentation/dto/streamer/create-streamer.dto';
import { StreamerResponseDto } from '@presentation/dto/streamer/streamer-response.dto';
import { StreamerController } from './streamer.controller';

describe('StreamerController', () => {
  let controller: StreamerController;
  let mockCreateStreamerUseCase: any;
  let mockGetAllStreamersUseCase: any;
  let mockUpdateStreamerUseCase: any;

  const mockStreamer = new Streamer(
    1,
    123,
    100,
    ['Twitch', 'YouTube'],
    ['Monday', 'Tuesday'],
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

    mockUpdateStreamerUseCase = {
      execute: jest.fn(),
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
          provide: UpdateStreamerUseCase,
          useValue: mockUpdateStreamerUseCase,
        },
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

      expect(result[0].id).toBe(1);
      expect(result[0].userId).toBe(123);
      expect(result[1].id).toBe(2);
      expect(result[1].userId).toBe(456);
    });

    it('deve retornar array vazio quando não há streamers', async () => {
      // Arrange
      mockGetAllStreamersUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockGetAllStreamersUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
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

  describe('update', () => {
    it('deve atualizar um streamer com todos os parâmetros', async () => {
      // Arrange
      const id = 1;
      const updateStreamerDto: Partial<CreateStreamerDto> = {
        points: 150,
        platforms: ['Twitch', 'Kick'],
        streamDays: ['Friday', 'Saturday'],
      };

      const updatedStreamer = new Streamer(
        1,
        123,
        150,
        ['Twitch', 'Kick'],
        ['Friday', 'Saturday'],
      );

      mockUpdateStreamerUseCase.execute.mockResolvedValue(updatedStreamer);

      // Act
      const result = await controller.update(id, updateStreamerDto);

      // Assert
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        points: 150,
        platforms: ['Twitch', 'Kick'],
        streamDays: ['Friday', 'Saturday'],
      });

      expect(result).toBeInstanceOf(StreamerResponseDto);
      expect(result.id).toBe(1);
      expect(result.points).toBe(150);
      expect(result.platforms).toEqual(['Twitch', 'Kick']);
      expect(result.streamDays).toEqual(['Friday', 'Saturday']);
    });

    it('deve atualizar apenas pontos', async () => {
      // Arrange
      const id = 1;
      const updateStreamerDto: Partial<CreateStreamerDto> = {
        points: 200,
      };

      const updatedStreamer = new Streamer(1, 123, 200, ['Twitch'], ['Monday']);
      mockUpdateStreamerUseCase.execute.mockResolvedValue(updatedStreamer);

      // Act
      const result = await controller.update(id, updateStreamerDto);

      // Assert
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        points: 200,
        platforms: undefined,
        streamDays: undefined,
      });

      expect(result.points).toBe(200);
    });

    it('deve atualizar apenas plataformas', async () => {
      // Arrange
      const id = 1;
      const updateStreamerDto: Partial<CreateStreamerDto> = {
        platforms: ['YouTube', 'Facebook Gaming'],
      };

      const updatedStreamer = new Streamer(
        1,
        123,
        100,
        ['YouTube', 'Facebook Gaming'],
        ['Monday'],
      );
      mockUpdateStreamerUseCase.execute.mockResolvedValue(updatedStreamer);

      // Act
      const result = await controller.update(id, updateStreamerDto);

      // Assert
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        points: undefined,
        platforms: ['YouTube', 'Facebook Gaming'],
        streamDays: undefined,
      });

      expect(result.platforms).toEqual(['YouTube', 'Facebook Gaming']);
    });

    it('deve atualizar apenas dias de stream', async () => {
      // Arrange
      const id = 1;
      const updateStreamerDto: Partial<CreateStreamerDto> = {
        streamDays: ['Sunday'],
      };

      const updatedStreamer = new Streamer(1, 123, 100, ['Twitch'], ['Sunday']);
      mockUpdateStreamerUseCase.execute.mockResolvedValue(updatedStreamer);

      // Act
      const result = await controller.update(id, updateStreamerDto);

      // Assert
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        points: undefined,
        platforms: undefined,
        streamDays: ['Sunday'],
      });

      expect(result.streamDays).toEqual(['Sunday']);
    });

    it('deve propagar NotFoundException quando streamer não existe', async () => {
      // Arrange
      const id = 999;
      const updateStreamerDto: Partial<CreateStreamerDto> = {
        points: 100,
      };

      const error = new NotFoundException('Streamer com ID 999 não encontrado');
      mockUpdateStreamerUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.update(id, updateStreamerDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 999,
        points: 100,
        platforms: undefined,
        streamDays: undefined,
      });
    });

    it('deve atualizar com arrays vazios', async () => {
      // Arrange
      const id = 1;
      const updateStreamerDto: Partial<CreateStreamerDto> = {
        platforms: [],
        streamDays: [],
      };

      const updatedStreamer = new Streamer(1, 123, 100, [], []);
      mockUpdateStreamerUseCase.execute.mockResolvedValue(updatedStreamer);

      // Act
      const result = await controller.update(id, updateStreamerDto);

      // Assert
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        points: undefined,
        platforms: [],
        streamDays: [],
      });

      expect(result.platforms).toEqual([]);
      expect(result.streamDays).toEqual([]);
    });

    it('deve atualizar com pontos zero', async () => {
      // Arrange
      const id = 1;
      const updateStreamerDto: Partial<CreateStreamerDto> = {
        points: 0,
      };

      const updatedStreamer = new Streamer(1, 123, 0, ['Twitch'], ['Monday']);
      mockUpdateStreamerUseCase.execute.mockResolvedValue(updatedStreamer);

      // Act
      const result = await controller.update(id, updateStreamerDto);

      // Assert
      expect(result.points).toBe(0);
    });

    it('deve atualizar sem nenhum parâmetro (DTO vazio)', async () => {
      // Arrange
      const id = 1;
      const updateStreamerDto: Partial<CreateStreamerDto> = {};

      mockUpdateStreamerUseCase.execute.mockResolvedValue(mockStreamer);

      // Act
      const result = await controller.update(id, updateStreamerDto);

      // Assert
      expect(mockUpdateStreamerUseCase.execute).toHaveBeenCalledWith({
        id: 1,
        points: undefined,
        platforms: undefined,
        streamDays: undefined,
      });

      expect(result).toBeInstanceOf(StreamerResponseDto);
    });
  });
});
