import { GenerateTokensUseCase } from '@application/use-cases/auth/generate-tokens.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { ValidateUserUseCase } from '@application/use-cases/auth/validate-user.use-case';
import { UpdateUserTokensUseCase } from '@application/use-cases/user/update-user-tokens.use-case';
import { User, UserRole } from '@domain/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmLoginDto } from '@presentation/dto/auth/confirm-login.dto';
import { LoginDto } from '@presentation/dto/auth/login.dto';
import { RefreshTokenDto } from '@presentation/dto/auth/refresh-token.dto';
import { RegisterDto } from '@presentation/dto/auth/register.dto';
import { UserResponseDto } from '@presentation/dto/user/user-response.dto';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegisterUserUseCase: any;
  let mockValidateUserUseCase: any;
  let mockGenerateTokensUseCase: any;
  let mockRefreshTokenUseCase: any;
  let mockUpdateUserTokensUseCase: any;

  const mockUser = new User(
    1,
    'testuser',
    'hashedpassword',
    UserRole.USER,
    'refresh-token',
    'web-token',
    'windows-token',
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
        nickname: 'testuser',
        password: 'password123',
        role: UserRole.USER,
      };

      mockRegisterUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'testuser',
        password: 'password123',
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
        nickname: 'testuser',
        password: 'password123',
        role: UserRole.USER,
      };

      const error = new Error('Usuário já existe');
      mockRegisterUserUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(
        'Usuário já existe',
      );
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'testuser',
        password: 'password123',
        role: UserRole.USER,
      });
    });

    it('deve registrar um administrador', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        nickname: 'admin',
        password: 'adminpass',
        role: UserRole.ADMIN,
      };

      const adminUser = new User(2, 'admin', 'hashedpass', UserRole.ADMIN);
      mockRegisterUserUseCase.execute.mockResolvedValue(adminUser);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'admin',
        password: 'adminpass',
        role: UserRole.ADMIN,
      });

      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange
      const loginDto: LoginDto = {
        nickname: 'testuser',
        password: 'password123',
      };

      mockValidateUserUseCase.execute.mockResolvedValue(mockUser);
      mockGenerateTokensUseCase.execute.mockResolvedValue({
        access_token: 'mock-access-token',
      });

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'testuser',
        password: 'password123',
      });

      expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith({
        user: mockUser,
        includeRefreshToken: false,
      });

      expect(result).toEqual({
        access_token: 'mock-access-token',
      });
    });

    it('deve propagar erro de validação de usuário', async () => {
      // Arrange
      const loginDto: LoginDto = {
        nickname: 'wronguser',
        password: 'wrongpass',
      };

      const error = new Error('Credenciais inválidas');
      mockValidateUserUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'wronguser',
        password: 'wrongpass',
      });
      expect(mockGenerateTokensUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve propagar erro de geração de tokens', async () => {
      // Arrange
      const loginDto: LoginDto = {
        nickname: 'testuser',
        password: 'password123',
      };

      mockValidateUserUseCase.execute.mockResolvedValue(mockUser);

      const error = new Error('Erro ao gerar tokens');
      mockGenerateTokensUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Erro ao gerar tokens',
      );
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'testuser',
        password: 'password123',
      });
      expect(mockGenerateTokensUseCase.execute).toHaveBeenCalledWith({
        user: mockUser,
        includeRefreshToken: false,
      });
    });
  });

  describe('confirmLogin', () => {
    it('deve confirmar login com sucesso', async () => {
      // Arrange
      const userId = 1;
      const confirmLoginDto: ConfirmLoginDto = {
        web_token: 'web-token-123',
        windows_token: 'windows-token-456',
      };

      mockUpdateUserTokensUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.confirmLogin(userId, confirmLoginDto);

      // Assert
      expect(mockUpdateUserTokensUseCase.execute).toHaveBeenCalledWith(1, {
        webToken: 'web-token-123',
        windowsToken: 'windows-token-456',
      });

      expect(result).toEqual({
        access_token: 'Bearer token-placeholder',
        refresh_token: 'Bearer refresh-token-placeholder',
      });
    });

    it('deve propagar erro do caso de uso de atualização de tokens', async () => {
      // Arrange
      const userId = 1;
      const confirmLoginDto: ConfirmLoginDto = {
        web_token: 'web-token-123',
        windows_token: 'windows-token-456',
      };

      const error = new Error('Usuário não encontrado');
      mockUpdateUserTokensUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.confirmLogin(userId, confirmLoginDto),
      ).rejects.toThrow('Usuário não encontrado');
      expect(mockUpdateUserTokensUseCase.execute).toHaveBeenCalledWith(1, {
        webToken: 'web-token-123',
        windowsToken: 'windows-token-456',
      });
    });

    it('deve confirmar login com tokens vazios', async () => {
      // Arrange
      const userId = 2;
      const confirmLoginDto: ConfirmLoginDto = {
        web_token: '',
        windows_token: '',
      };

      mockUpdateUserTokensUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.confirmLogin(userId, confirmLoginDto);

      // Assert
      expect(mockUpdateUserTokensUseCase.execute).toHaveBeenCalledWith(2, {
        webToken: '',
        windowsToken: '',
      });

      expect(result).toEqual({
        access_token: 'Bearer token-placeholder',
        refresh_token: 'Bearer refresh-token-placeholder',
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

      mockRefreshTokenUseCase.execute.mockResolvedValue(mockTokens);

      // Act
      const result = await controller.refreshToken(userId, refreshTokenDto);

      // Assert
      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith({
        userId: 1,
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toEqual(mockTokens);
    });

    it('deve propagar erro de token inválido', async () => {
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
        userId: 1,
        refreshToken: 'invalid-refresh-token',
      });
    });

    it('deve lidar com diferentes IDs de usuário', async () => {
      // Arrange
      const userId = 999;
      const refreshTokenDto: RefreshTokenDto = {
        refresh_token: 'some-refresh-token',
      };

      mockRefreshTokenUseCase.execute.mockResolvedValue(mockTokens);

      // Act
      const result = await controller.refreshToken(userId, refreshTokenDto);

      // Assert
      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith({
        userId: 999,
        refreshToken: 'some-refresh-token',
      });

      expect(result).toEqual(mockTokens);
    });
  });
});
