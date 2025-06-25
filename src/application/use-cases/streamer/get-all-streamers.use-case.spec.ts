import { STREAMER_REPOSITORY_TOKEN } from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { GetAllStreamersUseCase } from './get-all-streamers.use-case';

describe('GetAllStreamersUseCase', () => {
  let useCase: GetAllStreamersUseCase;
  let mockStreamerRepository: any;

  const mockStreamers = [
    new Streamer(
      1,
      123,
      100,
      ['Twitch'],
      ['Monday', 'Tuesday'],
      false,
      new Date('2024-01-01'),
      new Date('2024-01-01'),
    ),
    new Streamer(
      2,
      456,
      250,
      ['YouTube', 'Kick'],
      ['Wednesday', 'Friday'],
      true,
      new Date('2024-01-02'),
      new Date('2024-01-02'),
    ),
    new Streamer(
      3,
      789,
      50,
      ['Facebook Gaming'],
      ['Sunday'],
      false,
      new Date('2024-01-03'),
      new Date('2024-01-03'),
    ),
  ];

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
        GetAllStreamersUseCase,
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetAllStreamersUseCase>(GetAllStreamersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve retornar todos os streamers quando existem streamers no repositório', async () => {
      // Arrange
      mockStreamerRepository.findAll.mockResolvedValue(mockStreamers);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockStreamerRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockStreamerRepository.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(mockStreamers);
      expect(result).toHaveLength(3);
    });

    it('deve retornar array vazio quando não há streamers no repositório', async () => {
      // Arrange
      mockStreamerRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockStreamerRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockStreamerRepository.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('deve retornar um único streamer quando há apenas um no repositório', async () => {
      // Arrange
      const singleStreamer = [mockStreamers[0]];
      mockStreamerRepository.findAll.mockResolvedValue(singleStreamer);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockStreamerRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(singleStreamer);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].userId).toBe(123);
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockStreamerRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockStreamerRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('deve manter a estrutura dos objetos Streamer retornados', async () => {
      // Arrange
      mockStreamerRepository.findAll.mockResolvedValue(mockStreamers);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(3);

      // Verificar primeiro streamer
      expect(result[0]).toBeInstanceOf(Streamer);
      expect(result[0].id).toBe(1);
      expect(result[0].userId).toBe(123);
      expect(result[0].points).toBe(100);
      expect(result[0].platforms).toEqual(['Twitch']);
      expect(result[0].streamDays).toEqual(['Monday', 'Tuesday']);

      // Verificar segundo streamer
      expect(result[1]).toBeInstanceOf(Streamer);
      expect(result[1].id).toBe(2);
      expect(result[1].userId).toBe(456);
      expect(result[1].points).toBe(250);
      expect(result[1].platforms).toEqual(['YouTube', 'Kick']);
      expect(result[1].streamDays).toEqual(['Wednesday', 'Friday']);

      // Verificar terceiro streamer
      expect(result[2]).toBeInstanceOf(Streamer);
      expect(result[2].id).toBe(3);
      expect(result[2].userId).toBe(789);
      expect(result[2].points).toBe(50);
      expect(result[2].platforms).toEqual(['Facebook Gaming']);
      expect(result[2].streamDays).toEqual(['Sunday']);
    });

    it('deve funcionar com streamers que têm arrays vazios', async () => {
      // Arrange
      const streamersWithEmptyArrays = [
        new Streamer(
          4,
          999,
          0,
          [], // sem plataformas
          [], // sem dias de stream
          false,
          new Date('2024-01-04'),
          new Date('2024-01-04'),
        ),
      ];
      mockStreamerRepository.findAll.mockResolvedValue(
        streamersWithEmptyArrays,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].platforms).toEqual([]);
      expect(result[0].streamDays).toEqual([]);
      expect(result[0].points).toBe(0);
    });

    it('deve funcionar com streamers que têm pontos negativos', async () => {
      // Arrange
      const streamersWithNegativePoints = [
        new Streamer(
          5,
          888,
          -50, // pontos negativos
          ['Twitch'],
          ['Monday'],
          false,
          new Date('2024-01-05'),
          new Date('2024-01-05'),
        ),
      ];
      mockStreamerRepository.findAll.mockResolvedValue(
        streamersWithNegativePoints,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].points).toBe(-50);
      expect(result[0].platforms).toEqual(['Twitch']);
      expect(result[0].streamDays).toEqual(['Monday']);
    });
  });
});
