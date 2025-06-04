import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { StreamerRepository } from './streamer.repository';

describe('StreamerRepository', () => {
  let repository: StreamerRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    streamer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPrismaStreamer = {
    id: 1,
    userId: 1,
    points: 100,
    platforms: ['twitch', 'youtube'],
    streamDays: ['monday', 'wednesday'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamerRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<StreamerRepository>(StreamerRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um streamer com sucesso', async () => {
      // Arrange
      const streamerData = {
        userId: 1,
        points: 100,
        platforms: ['twitch'],
        streamDays: ['monday'],
      };
      mockPrismaService.streamer.create.mockResolvedValue(mockPrismaStreamer);

      // Act
      const result = await repository.create(streamerData);

      // Assert
      expect(mockPrismaService.streamer.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          points: 100,
          platforms: ['twitch'],
          streamDays: ['monday'],
        },
      });
      expect(result.id).toBe(1);
      expect(result.userId).toBe(1);
      expect(result.points).toBe(100);
    });

    it('deve criar um streamer com valores padrão', async () => {
      // Arrange
      const streamerData = { userId: 1 };
      const defaultStreamer = {
        ...mockPrismaStreamer,
        points: 0,
        platforms: [],
        streamDays: [],
      };
      mockPrismaService.streamer.create.mockResolvedValue(defaultStreamer);

      // Act
      const result = await repository.create(streamerData);

      // Assert
      expect(mockPrismaService.streamer.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          points: 0,
          platforms: [],
          streamDays: [],
        },
      });
      expect(result.points).toBe(0);
      expect(result.platforms).toEqual([]);
      expect(result.streamDays).toEqual([]);
    });
  });

  describe('findById', () => {
    it('deve encontrar um streamer por ID', async () => {
      // Arrange
      mockPrismaService.streamer.findUnique.mockResolvedValue(
        mockPrismaStreamer,
      );

      // Act
      const result = await repository.findById(1);

      // Assert
      expect(mockPrismaService.streamer.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
    });

    it('deve retornar null quando streamer não encontrado', async () => {
      // Arrange
      mockPrismaService.streamer.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('deve encontrar um streamer por userId', async () => {
      // Arrange
      mockPrismaService.streamer.findUnique.mockResolvedValue(
        mockPrismaStreamer,
      );

      // Act
      const result = await repository.findByUserId(1);

      // Assert
      expect(mockPrismaService.streamer.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(result).toBeDefined();
      expect(result!.userId).toBe(1);
    });

    it('deve retornar null quando userId não encontrado', async () => {
      // Arrange
      mockPrismaService.streamer.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findByUserId(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os streamers', async () => {
      // Arrange
      const streamers = [
        mockPrismaStreamer,
        { ...mockPrismaStreamer, id: 2, userId: 2 },
      ];
      mockPrismaService.streamer.findMany.mockResolvedValue(streamers);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(mockPrismaService.streamer.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('deve retornar array vazio quando não há streamers', async () => {
      // Arrange
      mockPrismaService.streamer.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('deve atualizar um streamer com sucesso', async () => {
      // Arrange
      const updateData = {
        points: 200,
        platforms: ['twitch', 'youtube'],
        streamDays: ['tuesday', 'friday'],
      };
      const updatedStreamer = { ...mockPrismaStreamer, ...updateData };
      mockPrismaService.streamer.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await repository.update(1, updateData);

      // Assert
      expect(mockPrismaService.streamer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          points: 200,
          platforms: ['twitch', 'youtube'],
          streamDays: ['tuesday', 'friday'],
        },
      });
      expect(result.points).toBe(200);
      expect(result.platforms).toEqual(['twitch', 'youtube']);
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      // Arrange
      const updateData = { points: 300 };
      const updatedStreamer = { ...mockPrismaStreamer, points: 300 };
      mockPrismaService.streamer.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await repository.update(1, updateData);

      // Assert
      expect(mockPrismaService.streamer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          points: 300,
          platforms: undefined,
          streamDays: undefined,
        },
      });
      expect(result.points).toBe(300);
    });
  });

  describe('delete', () => {
    it('deve deletar um streamer', async () => {
      // Arrange
      mockPrismaService.streamer.delete.mockResolvedValue(mockPrismaStreamer);

      // Act
      await repository.delete(1);

      // Assert
      expect(mockPrismaService.streamer.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('addPoints', () => {
    it('deve adicionar pontos a um streamer', async () => {
      // Arrange
      const updatedStreamer = { ...mockPrismaStreamer, points: 150 };
      mockPrismaService.streamer.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await repository.addPoints(1, 50);

      // Assert
      expect(mockPrismaService.streamer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          points: {
            increment: 50,
          },
        },
      });
      expect(result.points).toBe(150);
    });

    it('deve subtrair pontos (número negativo)', async () => {
      // Arrange
      const updatedStreamer = { ...mockPrismaStreamer, points: 80 };
      mockPrismaService.streamer.update.mockResolvedValue(updatedStreamer);

      // Act
      const result = await repository.addPoints(1, -20);

      // Assert
      expect(mockPrismaService.streamer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          points: {
            increment: -20,
          },
        },
      });
      expect(result.points).toBe(80);
    });
  });

  describe('toDomain', () => {
    it('deve converter dados do Prisma para entidade de domínio corretamente', async () => {
      // Arrange
      const streamerData = {
        userId: 1,
        points: 100,
        platforms: ['twitch'],
        streamDays: ['monday'],
      };
      mockPrismaService.streamer.create.mockResolvedValue(mockPrismaStreamer);

      // Act
      const result = await repository.create(streamerData);

      // Assert
      expect(result.id).toBe(1);
      expect(result.userId).toBe(1);
      expect(result.points).toBe(100);
      expect(result.platforms).toEqual(['twitch', 'youtube']);
      expect(result.streamDays).toEqual(['monday', 'wednesday']);
      expect(result.createdAt).toEqual(new Date('2024-01-01'));
      expect(result.updatedAt).toEqual(new Date('2024-01-01'));
    });
  });
});
