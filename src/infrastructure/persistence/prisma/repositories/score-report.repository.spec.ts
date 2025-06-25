import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ScoreReportRepository } from './score-report.repository';

describe('ScoreReportRepository', () => {
  let repository: ScoreReportRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      streamer: {
        findUnique: jest.fn(),
      },
      score: {
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreReportRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ScoreReportRepository>(ScoreReportRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getScoreReportByPeriod', () => {
    const mockStreamer = {
      id: 1,
      userId: 123,
      points: 100,
      platforms: ['Twitch'],
      streamDays: ['Monday'],
      isOnline: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      user: {
        id: 123,
        nickname: 'teststreamer',
        createdAt: new Date('2024-01-01'),
      },
    };

    const mockScores = [
      {
        id: 1,
        streamerId: 1,
        points: 50,
        date: new Date('2024-01-15'),
        hour: 20,
        minute: 30,
      },
      {
        id: 2,
        streamerId: 1,
        points: 30,
        date: new Date('2024-01-16'),
        hour: 21,
        minute: 15,
      },
    ];

    it('deve retornar relatório de score quando streamer existe', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');

      jest
        .spyOn(prismaService.streamer, 'findUnique')
        .mockResolvedValue(mockStreamer as any);
      jest
        .spyOn(prismaService.score, 'findMany')
        .mockResolvedValue(mockScores as any);

      // Act
      const result = await repository.getScoreReportByPeriod(
        1,
        startDate,
        endDate,
      );

      // Assert
      expect(prismaService.streamer.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: true },
      });

      expect(result).toEqual({
        streamerId: 1,
        nickname: 'teststreamer',
        totalPoints: 80,
        startDate,
        endDate,
        registrationDate: mockStreamer.user.createdAt,
        scores: [
          {
            id: 1,
            points: 50,
            date: new Date('2024-01-15'),
            hour: 20,
            minute: 30,
          },
          {
            id: 2,
            points: 30,
            date: new Date('2024-01-16'),
            hour: 21,
            minute: 15,
          },
        ],
      });
    });

    it('deve retornar null quando streamer não existe', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');

      jest.spyOn(prismaService.streamer, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await repository.getScoreReportByPeriod(
        999,
        startDate,
        endDate,
      );

      // Assert
      expect(result).toBeNull();
      expect(prismaService.streamer.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: { user: true },
      });
    });

    it('deve retornar relatório com totalPoints zero quando não há scores', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');

      jest
        .spyOn(prismaService.streamer, 'findUnique')
        .mockResolvedValue(mockStreamer as any);
      jest.spyOn(prismaService.score, 'findMany').mockResolvedValue([]);

      // Act
      const result = await repository.getScoreReportByPeriod(
        1,
        startDate,
        endDate,
      );

      // Assert
      expect(result).toEqual({
        streamerId: 1,
        nickname: 'teststreamer',
        totalPoints: 0,
        startDate,
        endDate,
        registrationDate: mockStreamer.user.createdAt,
        scores: [],
      });
    });
  });

  describe('getScoresByDateGroupedByHour', () => {
    const mockScoresWithStreamer = [
      {
        id: 1,
        streamerId: 1,
        points: 25,
        date: new Date('2024-01-15'),
        hour: 20,
        minute: 30,
        streamer: {
          id: 1,
          user: { nickname: 'streamer1' },
        },
      },
      {
        id: 2,
        streamerId: 1,
        points: 15,
        date: new Date('2024-01-15'),
        hour: 20,
        minute: 45,
        streamer: {
          id: 1,
          user: { nickname: 'streamer1' },
        },
      },
      {
        id: 3,
        streamerId: 2,
        points: 30,
        date: new Date('2024-01-15'),
        hour: 21,
        minute: 0,
        streamer: {
          id: 2,
          user: { nickname: 'streamer2' },
        },
      },
    ];

    it('deve agrupar scores por streamer e hora', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      jest
        .spyOn(prismaService.score, 'findMany')
        .mockResolvedValue(mockScoresWithStreamer as any);

      // Act
      const result = await repository.getScoresByDateGroupedByHour(date);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        streamerId: 1,
        nickname: 'streamer1',
        pointsByHour: {
          '20h': 40, // 25 + 15
        },
      });
      expect(result[1]).toEqual({
        streamerId: 2,
        nickname: 'streamer2',
        pointsByHour: {
          '21h': 30,
        },
      });
    });

    it('deve retornar array vazio quando não há scores', async () => {
      // Arrange
      const date = new Date('2024-01-15');
      jest.spyOn(prismaService.score, 'findMany').mockResolvedValue([]);

      // Act
      const result = await repository.getScoresByDateGroupedByHour(date);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getWeeklyRanking', () => {
    const mockGroupedScores = [
      {
        streamerId: 1,
        _sum: { points: 150 },
        _count: { _all: 3 },
      },
      {
        streamerId: 2,
        _sum: { points: 100 },
        _count: { _all: 2 },
      },
    ];

    const mockStreamers = [
      {
        id: 1,
        user: { nickname: 'streamer1' },
      },
      {
        id: 2,
        user: { nickname: 'streamer2' },
      },
    ];

    const mockUniqueDays = [
      { date: new Date('2024-01-15') },
      { date: new Date('2024-01-16') },
    ];

    it('deve retornar ranking semanal ordenado por pontos', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-21');

      jest
        .spyOn(prismaService.score, 'groupBy')
        .mockResolvedValueOnce(mockGroupedScores as any)
        .mockResolvedValue(mockUniqueDays as any);

      jest
        .spyOn(prismaService.streamer, 'findUnique')
        .mockResolvedValueOnce(mockStreamers[0] as any)
        .mockResolvedValueOnce(mockStreamers[1] as any);

      // Act
      const result = await repository.getWeeklyRanking(startDate, endDate);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        position: 1,
        streamerId: 1,
        nickname: 'streamer1',
        totalPoints: 150,
        averagePoints: 75, // 150 / 2 dias
        dailyPoints: {},
      });
      expect(result[1]).toEqual({
        position: 2,
        streamerId: 2,
        nickname: 'streamer2',
        totalPoints: 100,
        averagePoints: 50, // 100 / 2 dias
        dailyPoints: {},
      });
    });

    it('deve retornar array vazio quando não há scores', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-21');

      jest.spyOn(prismaService.score, 'groupBy').mockResolvedValue([]);

      // Act
      const result = await repository.getWeeklyRanking(startDate, endDate);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getWeeklyAverage', () => {
    const mockStreamer = {
      id: 1,
      user: { nickname: 'teststreamer' },
    };

    const mockDailyScores = [
      {
        date: new Date('2024-01-15'),
        _sum: { points: 50 },
      },
      {
        date: new Date('2024-01-16'),
        _sum: { points: 30 },
      },
    ];

    it('deve retornar média semanal quando streamer existe', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-21');

      jest
        .spyOn(prismaService.streamer, 'findUnique')
        .mockResolvedValue(mockStreamer as any);
      jest
        .spyOn(prismaService.score, 'groupBy')
        .mockResolvedValue(mockDailyScores as any);

      // Act
      const result = await repository.getWeeklyAverage(1, startDate, endDate);

      // Assert
      expect(result).toEqual({
        streamerId: 1,
        nickname: 'teststreamer',
        totalPoints: 80,
        averagePoints: 40, // 80 / 2 dias
        daysWithPoints: 2,
        dailyBreakdown: expect.any(Object),
      });
    });

    it('deve retornar null quando streamer não existe', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-21');

      jest.spyOn(prismaService.streamer, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await repository.getWeeklyAverage(999, startDate, endDate);

      // Assert
      expect(result).toBeNull();
    });

    it('deve retornar média zero quando não há pontos', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-21');

      jest
        .spyOn(prismaService.streamer, 'findUnique')
        .mockResolvedValue(mockStreamer as any);
      jest.spyOn(prismaService.score, 'groupBy').mockResolvedValue([]);

      // Act
      const result = await repository.getWeeklyAverage(1, startDate, endDate);

      // Assert
      expect(result).toEqual({
        streamerId: 1,
        nickname: 'teststreamer',
        totalPoints: 0,
        averagePoints: 0,
        daysWithPoints: 0,
        dailyBreakdown: {},
      });
    });
  });

  describe('getDailyScoresForWeek', () => {
    const mockDailyScores = [
      {
        date: new Date('2024-01-15'),
        _sum: { points: 100 },
      },
    ];

    const mockStreamersGrouped = [
      {
        streamerId: 1,
        _sum: { points: 60 },
      },
      {
        streamerId: 2,
        _sum: { points: 40 },
      },
    ];

    const mockStreamers = [
      {
        id: 1,
        user: { nickname: 'streamer1' },
      },
      {
        id: 2,
        user: { nickname: 'streamer2' },
      },
    ];

    it('deve retornar scores diários com streamers', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-21');

      jest
        .spyOn(prismaService.score, 'groupBy')
        .mockResolvedValueOnce(mockDailyScores as any)
        .mockResolvedValueOnce(mockStreamersGrouped as any);

      jest
        .spyOn(prismaService.streamer, 'findUnique')
        .mockResolvedValueOnce(mockStreamers[0] as any)
        .mockResolvedValueOnce(mockStreamers[1] as any);

      // Act
      const result = await repository.getDailyScoresForWeek(startDate, endDate);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: new Date('2024-01-15'),
        dayOfWeek: expect.any(String),
        streamers: [
          {
            streamerId: 1,
            nickname: 'streamer1',
            points: 60,
          },
          {
            streamerId: 2,
            nickname: 'streamer2',
            points: 40,
          },
        ],
      });
    });

    it('deve retornar array vazio quando não há scores', async () => {
      // Arrange
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-21');

      jest.spyOn(prismaService.score, 'groupBy').mockResolvedValue([]);

      // Act
      const result = await repository.getDailyScoresForWeek(startDate, endDate);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
