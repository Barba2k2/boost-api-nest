import { GenerateTokensUseCase } from '@application/use-cases/auth/generate-tokens.use-case';
import { GetLoginLogsUseCase } from '@application/use-cases/auth/get-login-logs.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { ValidateUserUseCase } from '@application/use-cases/auth/validate-user.use-case';
import { UpdateLastLoginUseCase } from '@application/use-cases/user/update-last-login.use-case';
import { UpdateUserTokensUseCase } from '@application/use-cases/user/update-user-tokens.use-case';
import { User, UserRole } from '@domain/entities/user.entity';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmLoginDto } from '@presentation/dto/auth/confirm-login.dto';
import { LoginDto } from '@presentation/dto/auth/login.dto';
import { RefreshTokenDto } from '@presentation/dto/auth/refresh-token.dto';
import { RegisterDto } from '@presentation/dto/auth/register.dto';
import { UserResponseDto } from '@presentation/dto/user/user-response.dto';
import { RateLimitService } from '../../infrastructure/cache/rate-limit.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegisterUserUseCase: any;
  let mockValidateUserUseCase: any;
  let mockGenerateTokensUseCase: any;
  let mockRefreshTokenUseCase: any;
  let mockUpdateUserTokensUseCase: any;
  let mockUpdateLastLoginUseCase: any;
  let mockGetLoginLogsUseCase: any;

  const mockUser = new User(
    1,
    'testuser',
    'hashedpassword',
    UserRole.USER,
    'test@example.com',
    'Test User',
    'refresh-token',
    'web-token',
    'windows-token',
    new Date('2024-01-01'),
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );

  const mockTokens = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  };

  beforeEach(async () => {
    mockRegisterUserUseCase = {
      execute: jest.fn(),
    };

    mockValidateUserUseCase = {
      execute: jest.fn(),
    };

    mockGenerateTokensUseCase = {
      execute: jest.fn(),
    };

    mockRefreshTokenUseCase = {
      execute: jest.fn(),
    };

    mockUpdateUserTokensUseCase = {
      execute: jest.fn(),
    };

    mockUpdateLastLoginUseCase = {
      execute: jest.fn(),
    };

    mockGetLoginLogsUseCase = {
      execute: jest.fn(),
    };

    const mockRateLimitService = {
      checkLoginRateLimit: jest.fn(),
      isTemporarilyBlocked: jest.fn(),
      incrementFailedAttempts: jest.fn(),
      clearFailedAttempts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: RegisterUserUseCase,
          useValue: mockRegisterUserUseCase,
        },
        {
          provide: ValidateUserUseCase,
          useValue: mockValidateUserUseCase,
        },
        {
          provide: GenerateTokensUseCase,
          useValue: mockGenerateTokensUseCase,
        },
        {
          provide: RefreshTokenUseCase,
          useValue: mockRefreshTokenUseCase,
        },
        {
          provide: UpdateUserTokensUseCase,
          useValue: mockUpdateUserTokensUseCase,
        },
        {
          provide: UpdateLastLoginUseCase,
          useValue: mockUpdateLastLoginUseCase,
        },
        {
          provide: GetLoginLogsUseCase,
          useValue: mockGetLoginLogsUseCase,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um usuário com sucesso', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: UserRole.USER,
      };

      mockRegisterUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: UserRole.USER,
      });

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toBe(mockUser.id);
      expect(result.nickname).toBe(mockUser.nickname);
      expect(result.role).toBe(mockUser.role);
    });

    it('deve propagar erro do caso de uso', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: UserRole.USER,
      };

      const error = new Error('Usuário já existe');
      mockRegisterUserUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(
        'Usuário já existe',
      );
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: UserRole.USER,
      });
    });

    it('deve registrar um administrador', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        fullName: 'Admin User',
        nickname: 'admin',
        email: 'admin@example.com',
        password: 'adminpass',
        confirmPassword: 'adminpass',
        role: UserRole.ADMIN,
      };

      const adminUser = new User(
        2,
        'admin',
        'hashedpass',
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
      mockRegisterUserUseCase.execute.mockResolvedValue(adminUser);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Admin User',
        nickname: 'admin',
        email: 'admin@example.com',
        password: 'adminpass',
        confirmPassword: 'adminpass',
        role: UserRole.ADMIN,
      });

      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange
      const loginDto: LoginDto = {
        emailOrNickname: 'testuser',
        password: 'password123',
      };

      mockValidateUserUseCase.execute.mockResolvedValue(mockUser);
      mockUpdateLastLoginUseCase.execute.mockResolvedValue(mockUser);
      mockGenerateTokensUseCase.execute.mockResolvedValue({
        access_token: 'mock-access-token',
      });

      // Act
      const mockReq = {};
      const result = await controller.login(loginDto, mockReq);

      // Assert
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        emailOrNickname: 'testuser',
        password: 'password123',
      });

      expect(mockUpdateLastLoginUseCase.execute).toHaveBeenCalledWith(
        mockUser.id,
      );

      expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith({
        user: mockUser,
        includeRefreshToken: false,
      });

      expect(result).toEqual({
        access_token: 'mock-access-token',
      });
    });

    it('deve propagar erro de validação', async () => {
      // Arrange
      const loginDto: LoginDto = {
        emailOrNickname: 'testuser',
        password: 'wrongpassword',
      };

      const error = new Error('Credenciais inválidas');
      mockValidateUserUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      const mockReq = {};
      await expect(controller.login(loginDto, mockReq)).rejects.toThrow(
        'Credenciais inválidas',
      );

      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        emailOrNickname: 'testuser',
        password: 'wrongpassword',
      });

      expect(mockUpdateLastLoginUseCase.execute).not.toHaveBeenCalled();
      expect(mockGenerateTokensUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('confirmLogin', () => {
    it('deve confirmar login com sucesso', async () => {
      // Arrange
      const userId = 1;
      const confirmLoginDto: ConfirmLoginDto = {
        web_token: 'web-token-123',
        windows_token: 'windows-token-123',
      };

      const updatedUser = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.USER,
        'test@example.com',
        'Test User',
        undefined,
        'web-token-123',
        'windows-token-123',
        new Date(),
        new Date(),
        new Date(),
      );
      mockUpdateUserTokensUseCase.execute.mockResolvedValue(updatedUser);

      // Act
      const result = await controller.confirmLogin(userId, confirmLoginDto);

      // Assert
      expect(mockUpdateUserTokensUseCase.execute).toHaveBeenCalledWith(userId, {
        webToken: 'web-token-123',
        windowsToken: 'windows-token-123',
      });

      expect(result).toEqual({
        access_token: 'Bearer token-placeholder',
        refresh_token: 'Bearer refresh-token-placeholder',
      });
    });

    it('deve propagar erro de atualização', async () => {
      // Arrange
      const userId = 999;
      const confirmLoginDto: ConfirmLoginDto = {
        web_token: 'web-token-123',
        windows_token: 'windows-token-123',
      };

      const error = new Error('Usuário não encontrado');
      mockUpdateUserTokensUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.confirmLogin(userId, confirmLoginDto),
      ).rejects.toThrow('Usuário não encontrado');

      expect(mockUpdateUserTokensUseCase.execute).toHaveBeenCalledWith(userId, {
        webToken: 'web-token-123',
        windowsToken: 'windows-token-123',
      });
    });
  });

  describe('refreshToken', () => {
    it('deve renovar token com sucesso', async () => {
      // Arrange
      const userId = 1;
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'valid-refresh-token',
      };

      const newTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockRefreshTokenUseCase.execute.mockResolvedValue(newTokens);

      // Act
      const result = await controller.refreshToken(userId, refreshTokenDto);

      // Assert
      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith({
        userId,
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toEqual(newTokens);
    });

    it('deve propagar erro de refresh token inválido', async () => {
      // Arrange
      const userId = 1;
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'invalid-refresh-token',
      };

      const error = new Error('Token inválido ou expirado');
      mockRefreshTokenUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.refreshToken(userId, refreshTokenDto),
      ).rejects.toThrow('Token inválido ou expirado');

      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith({
        userId,
        refreshToken: 'invalid-refresh-token',
      });
    });
  });

  describe('getLoginLogs', () => {
    it('deve obter logs de login com sucesso', async () => {
      // Arrange
      const mockLoginLogs = {
        logs: [
          {
            userId: 1,
            nickname: 'admin',
            role: 'admin',
            lastLogin: new Date('2024-01-15T10:30:00.000Z'),
          },
          {
            userId: 2,
            nickname: 'user1',
            role: 'user',
            lastLogin: new Date('2024-01-14T15:20:00.000Z'),
          },
        ],
        total: 2,
      };

      mockGetLoginLogsUseCase.execute.mockResolvedValue(mockLoginLogs);

      // Act
      const result = await controller.getLoginLogs(50, 0);

      // Assert
      expect(mockGetLoginLogsUseCase.execute).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
      });

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('deve usar valores padrão quando não fornecido', async () => {
      // Arrange
      const mockLoginLogs = {
        logs: [],
        total: 0,
      };

      mockGetLoginLogsUseCase.execute.mockResolvedValue(mockLoginLogs);

      // Act
      const result = await controller.getLoginLogs();

      // Assert
      expect(mockGetLoginLogsUseCase.execute).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
      });

      expect(result.logs).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('deve propagar erro do caso de uso', async () => {
      // Arrange
      const error = new Error('Erro interno do servidor');
      mockGetLoginLogsUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getLoginLogs(10, 0)).rejects.toThrow(
        'Erro interno do servidor',
      );

      expect(mockGetLoginLogsUseCase.execute).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
      });
    });
  });
});
