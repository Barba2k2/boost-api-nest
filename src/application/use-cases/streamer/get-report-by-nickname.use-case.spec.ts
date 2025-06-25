import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
  ScoreReportData,
} from '@application/ports/repositories/score.repository.interface';
import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GetReportByNicknameCommand,
  GetReportByNicknameUseCase,
} from './get-report-by-nickname.use-case';

describe('GetReportByNicknameUseCase', () => {
  let useCase: GetReportByNicknameUseCase;
  let streamerRepository: jest.Mocked<IStreamerRepository>;
  let scoreRepository: jest.Mocked<IScoreRepository>;

  const mockStreamerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByNickname: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addPoints: jest.fn(),
    updateOnlineStatus: jest.fn(),
    findOnlineStreamers: jest.fn(),
  };

  const mockScoreRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByStreamerId: jest.fn(),
    findByStreamerIdAndDateRange: jest.fn(),
    getTotalPointsByStreamer: jest.fn(),
    getScoresByHour: jest.fn(),
    getDailyPoints: jest.fn(),
    getScoreReportByPeriod: jest.fn(),
    getStreamerRanking: jest.fn(),
    getWeeklyAverage: jest.fn(),
    createScoreValidation: jest.fn(),
    findScoreValidation: jest.fn(),
    getAdminPeriodSummary: jest.fn(),
    getDailyScoresForWeek: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetReportByNicknameUseCase,
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
        {
          provide: SCORE_REPOSITORY_TOKEN,
          useValue: mockScoreRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetReportByNicknameUseCase>(
      GetReportByNicknameUseCase,
    );
    streamerRepository = module.get(STREAMER_REPOSITORY_TOKEN);
    scoreRepository = module.get(SCORE_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockStreamer = new Streamer(
      1,
      1,
      100,
      ['twitch'],
      ['monday', 'wednesday'],
      false,
    );

    const mockReportData: ScoreReportData = {
      streamerId: 1,
      nickname: 'teststreamer',
      totalPoints: 450,
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-20'),
      registrationDate: new Date('2024-01-01'),
      scores: [
        {
          id: 1,
          points: 100,
          date: new Date('2024-01-10'),
          hour: 10,
          minute: 30,
        },
        {
          id: 2,
          points: 120,
          date: new Date('2024-01-15'),
          hour: 14,
          minute: 15,
        },
        {
          id: 3,
          points: 80,
          date: new Date('2024-01-18'),
          hour: 16,
          minute: 45,
        },
      ],
    };

    const validCommand: GetReportByNicknameCommand = {
      nickname: 'teststreamer',
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-20'),
    };

    it('deve retornar relatório com sucesso', async () => {
      // Arrange
      streamerRepository.findByNickname.mockResolvedValue(mockStreamer);
      scoreRepository.getScoreReportByPeriod.mockResolvedValue(mockReportData);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(streamerRepository.findByNickname).toHaveBeenCalledWith(
        'teststreamer',
      );
      expect(scoreRepository.getScoreReportByPeriod).toHaveBeenCalledWith(
        1, // streamer.id
        new Date('2024-01-10'),
        new Date('2024-01-20'),
      );

      expect(result).toEqual(mockReportData);
    });

    it('deve lançar NotFoundException quando streamer não é encontrado', async () => {
      // Arrange
      streamerRepository.findByNickname.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        "Streamer com nickname 'teststreamer' não encontrado",
      );

      expect(streamerRepository.findByNickname).toHaveBeenCalledWith(
        'teststreamer',
      );
      expect(scoreRepository.getScoreReportByPeriod).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando data de início é posterior à data de fim', async () => {
      // Arrange
      const invalidCommand: GetReportByNicknameCommand = {
        nickname: 'teststreamer',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-10'),
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(
        'Data de início não pode ser posterior à data de fim',
      );

      expect(streamerRepository.findByNickname).not.toHaveBeenCalled();
      expect(scoreRepository.getScoreReportByPeriod).not.toHaveBeenCalled();
    });

    it('deve retornar null quando scoreRepository retorna null', async () => {
      // Arrange
      streamerRepository.findByNickname.mockResolvedValue(mockStreamer);
      scoreRepository.getScoreReportByPeriod.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(streamerRepository.findByNickname).toHaveBeenCalledWith(
        'teststreamer',
      );
      expect(scoreRepository.getScoreReportByPeriod).toHaveBeenCalledWith(
        1,
        new Date('2024-01-10'),
        new Date('2024-01-20'),
      );

      expect(result).toBeNull();
    });

    it('deve funcionar com datas iguais (mesmo dia)', async () => {
      // Arrange
      const sameDayCommand: GetReportByNicknameCommand = {
        nickname: 'teststreamer',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-15'),
      };

      streamerRepository.findByNickname.mockResolvedValue(mockStreamer);
      scoreRepository.getScoreReportByPeriod.mockResolvedValue(mockReportData);

      // Act
      const result = await useCase.execute(sameDayCommand);

      // Assert
      expect(result).toEqual(mockReportData);
      expect(scoreRepository.getScoreReportByPeriod).toHaveBeenCalledWith(
        1,
        new Date('2024-01-15'),
        new Date('2024-01-15'),
      );
    });

    it('deve buscar relatório com diferentes nicknames', async () => {
      // Arrange
      const command1: GetReportByNicknameCommand = {
        nickname: 'streamer1',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20'),
      };

      const command2: GetReportByNicknameCommand = {
        nickname: 'streamer2',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-20'),
      };

      const mockStreamer2 = new Streamer(
        2,
        2,
        200,
        ['youtube'],
        ['friday'],
        true,
      );

      streamerRepository.findByNickname
        .mockResolvedValueOnce(mockStreamer)
        .mockResolvedValueOnce(mockStreamer2);
      scoreRepository.getScoreReportByPeriod.mockResolvedValue(mockReportData);

      // Act
      await useCase.execute(command1);
      await useCase.execute(command2);

      // Assert
      expect(streamerRepository.findByNickname).toHaveBeenNthCalledWith(
        1,
        'streamer1',
      );
      expect(streamerRepository.findByNickname).toHaveBeenNthCalledWith(
        2,
        'streamer2',
      );
      expect(scoreRepository.getScoreReportByPeriod).toHaveBeenNthCalledWith(
        1,
        1, // primeiro streamer
        new Date('2024-01-10'),
        new Date('2024-01-20'),
      );
      expect(scoreRepository.getScoreReportByPeriod).toHaveBeenNthCalledWith(
        2,
        2, // segundo streamer
        new Date('2024-01-10'),
        new Date('2024-01-20'),
      );
    });

    it('deve lidar com períodos longos de tempo', async () => {
      // Arrange
      const longPeriodCommand: GetReportByNicknameCommand = {
        nickname: 'teststreamer',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      streamerRepository.findByNickname.mockResolvedValue(mockStreamer);
      scoreRepository.getScoreReportByPeriod.mockResolvedValue(mockReportData);

      // Act
      const result = await useCase.execute(longPeriodCommand);

      // Assert
      expect(result).toEqual(mockReportData);
      expect(scoreRepository.getScoreReportByPeriod).toHaveBeenCalledWith(
        1,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );
    });
  });
});
