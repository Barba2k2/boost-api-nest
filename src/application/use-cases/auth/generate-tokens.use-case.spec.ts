import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { User, UserRole } from '@domain/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GenerateTokensCommand,
  GenerateTokensUseCase,
} from './generate-tokens.use-case';

describe('GenerateTokensUseCase', () => {
  let useCase: GenerateTokensUseCase;
  let jwtService: jest.Mocked<JwtService>;
  let streamerRepository: jest.Mocked<IStreamerRepository>;

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockStreamerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addPoints: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateTokensUseCase,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: STREAMER_REPOSITORY_TOKEN,
          useValue: mockStreamerRepository,
        },
      ],
    }).compile();

    useCase = module.get<GenerateTokensUseCase>(GenerateTokensUseCase);
    jwtService = module.get(JwtService);
    streamerRepository = module.get(STREAMER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockUser = new User(1, 'testuser', 'hashedpassword', UserRole.USER);
    const mockStreamer = new Streamer(1, 1, 100, ['twitch'], ['monday']);

    const validCommand: GenerateTokensCommand = {
      user: mockUser,
    };

    it('deve gerar tokens para usuário com streamer', async () => {
      // Arrange
      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      jwtService.sign.mockReturnValueOnce('mock-access-token');

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        streamerId: 1,
      });

      expect(result).toEqual({
        access_token: 'mock-access-token',
      });
    });

    it('deve gerar tokens para usuário sem streamer', async () => {
      // Arrange
      streamerRepository.findByUserId.mockResolvedValue(null);
      jwtService.sign.mockReturnValueOnce('mock-access-token');

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        streamerId: null,
      });

      expect(result).toEqual({
        access_token: 'mock-access-token',
      });
    });

    it('deve gerar tokens para usuário ADMIN', async () => {
      // Arrange
      const adminUser = new User(2, 'admin', 'hash', UserRole.ADMIN);
      const adminCommand = { user: adminUser };

      streamerRepository.findByUserId.mockResolvedValue(null);
      jwtService.sign.mockReturnValueOnce('admin-access-token');

      // Act
      const result = await useCase.execute(adminCommand);

      // Assert
      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(2);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 2,
        nickname: 'admin',
        role: UserRole.ADMIN,
        streamerId: null,
      });

      expect(result).toEqual({
        access_token: 'admin-access-token',
      });
    });

    it('deve gerar tokens para usuário ASSISTANT', async () => {
      // Arrange
      const assistantUser = new User(
        3,
        'assistant',
        'hash',
        UserRole.ASSISTANT,
      );
      const assistantCommand = { user: assistantUser };

      streamerRepository.findByUserId.mockResolvedValue(null);
      jwtService.sign.mockReturnValueOnce('assistant-access-token');

      // Act
      const result = await useCase.execute(assistantCommand);

      // Assert
      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(3);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 3,
        nickname: 'assistant',
        role: UserRole.ASSISTANT,
        streamerId: null,
      });

      expect(result).toEqual({
        access_token: 'assistant-access-token',
      });
    });

    it('deve gerar access_token e refresh_token quando includeRefreshToken é true', async () => {
      // Arrange
      const commandWithRefresh: GenerateTokensCommand = {
        user: mockUser,
        includeRefreshToken: true,
      };

      streamerRepository.findByUserId.mockResolvedValue(mockStreamer);
      jwtService.sign.mockReturnValueOnce('mock-access-token');
      jwtService.sign.mockReturnValueOnce('mock-refresh-token');

      // Act
      const result = await useCase.execute(commandWithRefresh);

      // Assert
      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenNthCalledWith(1, {
        sub: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        streamerId: 1,
      });
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: 1,
          role: UserRole.USER,
        },
        { expiresIn: '20d' },
      );

      expect(result).toEqual({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      });
    });

    it('deve tratar erro do repositório', async () => {
      // Arrange
      streamerRepository.findByUserId.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Database error',
      );
      expect(streamerRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
