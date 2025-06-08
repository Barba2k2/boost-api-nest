import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from '../../../infrastructure/cache/rate-limit.service';
import { SessionService } from '../../../infrastructure/cache/session.service';
import {
  AuthenticateCommand,
  AuthenticateResult,
  AuthenticateUserUseCase,
} from './authenticate-user.use-case';

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let sessionService: jest.Mocked<SessionService>;
  let rateLimitService: jest.Mocked<RateLimitService>;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    updateTokens: jest.fn(),
    updateLastLogin: jest.fn(),
    existsByNickname: jest.fn(),
  };

  const mockSessionService = {
    createSession: jest.fn(),
    getSession: jest.fn(),
    destroySession: jest.fn(),
    updateActivity: jest.fn(),
    generateSessionId: jest.fn(),
    addUserSession: jest.fn(),
    removeUserSession: jest.fn(),
    getUserSessions: jest.fn(),
    destroyAllUserSessions: jest.fn(),
  };

  const mockRateLimitService = {
    checkLoginRateLimit: jest.fn(),
    isTemporarilyBlocked: jest.fn(),
    incrementFailedAttempts: jest.fn(),
    clearFailedAttempts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateUserUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
      ],
    }).compile();

    useCase = module.get<AuthenticateUserUseCase>(AuthenticateUserUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
    sessionService = module.get(SessionService);
    rateLimitService = module.get(RateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: AuthenticateCommand = {
      nickname: 'testuser',
      password: 'plainpassword',
    };

    const mockUser = new User(
      1,
      'testuser',
      'hashedpassword',
      UserRole.USER,
      'test@example.com',
      'Test User',
      undefined,
      undefined,
      undefined,
      new Date(),
      new Date(),
      new Date(),
    );
    const mockSessionId = 'session-123';

    beforeEach(() => {
      // Setup default mocks
      rateLimitService.checkLoginRateLimit.mockResolvedValue({
        allowed: true,
        remainingRequests: 4,
        resetTime: Date.now() + 60000,
        totalRequests: 1,
      });
      rateLimitService.isTemporarilyBlocked.mockResolvedValue(false);
      sessionService.createSession.mockResolvedValue(mockSessionId);
    });

    it('deve retornar resultado com usuário e sessionId quando autenticação for bem-sucedida', async () => {
      // Arrange
      userRepository.findByNickname.mockResolvedValue(mockUser);

      // Act
      const result: AuthenticateResult = await useCase.execute(validCommand);

      // Assert
      expect(userRepository.findByNickname).toHaveBeenCalledWith('testuser');
      expect(sessionService.createSession).toHaveBeenCalledWith(
        mockUser,
        undefined,
      );
      expect(rateLimitService.clearFailedAttempts).toHaveBeenCalledWith(
        'testuser',
      );

      expect(result).toEqual({
        user: mockUser,
        sessionId: mockSessionId,
      });
      expect(result.user.role).toBe(UserRole.USER);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      // Arrange
      userRepository.findByNickname.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(userRepository.findByNickname).toHaveBeenCalledWith('testuser');
      expect(rateLimitService.incrementFailedAttempts).toHaveBeenCalledWith(
        'testuser',
      );
      expect(sessionService.createSession).not.toHaveBeenCalled();
    });

    it('deve retornar resultado para usuário ADMIN', async () => {
      // Arrange
      const adminUser = new User(
        2,
        'admin',
        'adminpass',
        UserRole.ADMIN,
        'admin@example.com',
        'Admin User',
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
        new Date(),
      );
      const adminCommand = { nickname: 'admin', password: 'adminpass123' };

      userRepository.findByNickname.mockResolvedValue(adminUser);

      // Act
      const result: AuthenticateResult = await useCase.execute(adminCommand);

      // Assert
      expect(userRepository.findByNickname).toHaveBeenCalledWith('admin');
      expect(result.user).toEqual(adminUser);
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(result.sessionId).toBe(mockSessionId);
    });

    it('deve retornar resultado para usuário ASSISTANT', async () => {
      // Arrange
      const assistantUser = new User(
        3,
        'assistant',
        'assistantpass',
        UserRole.ASSISTANT,
        'assistant@example.com',
        'Assistant User',
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
        new Date(),
      );
      const assistantCommand = {
        nickname: 'assistant',
        password: 'assistantpass123',
      };

      userRepository.findByNickname.mockResolvedValue(assistantUser);

      // Act
      const result: AuthenticateResult =
        await useCase.execute(assistantCommand);

      // Assert
      expect(userRepository.findByNickname).toHaveBeenCalledWith('assistant');
      expect(result.user).toEqual(assistantUser);
      expect(result.user.role).toBe(UserRole.ASSISTANT);
      expect(result.sessionId).toBe(mockSessionId);
    });

    it('deve lançar erro quando rate limit for excedido', async () => {
      // Arrange
      rateLimitService.checkLoginRateLimit.mockResolvedValue({
        allowed: false,
        remainingRequests: 0,
        resetTime: Date.now() + 120000, // 2 minutes
        totalRequests: 5,
      });

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(userRepository.findByNickname).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando conta estiver temporariamente bloqueada', async () => {
      // Arrange
      rateLimitService.isTemporarilyBlocked.mockResolvedValue(true);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException(
          'Conta temporariamente bloqueada devido a muitas tentativas falhadas.',
        ),
      );

      expect(userRepository.findByNickname).not.toHaveBeenCalled();
    });

    it('deve usar IP como identificador quando fornecido nos metadados', async () => {
      // Arrange
      const commandWithMetadata: AuthenticateCommand = {
        ...validCommand,
        metadata: { ip: '192.168.1.1', userAgent: 'test-agent' },
      };

      userRepository.findByNickname.mockResolvedValue(mockUser);

      // Act
      await useCase.execute(commandWithMetadata);

      // Assert
      expect(rateLimitService.checkLoginRateLimit).toHaveBeenCalledWith(
        '192.168.1.1',
      );
      expect(sessionService.createSession).toHaveBeenCalledWith(mockUser, {
        ip: '192.168.1.1',
        userAgent: 'test-agent',
      });
    });
  });
});
