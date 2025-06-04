import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GenerateTokensUseCase,
  TokensResult,
} from './generate-tokens.use-case';
import {
  RefreshTokenCommand,
  RefreshTokenUseCase,
} from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: jest.Mocked<IUserRepository>;
  let generateTokensUseCase: jest.Mocked<GenerateTokensUseCase>;

  const mockJwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  };

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    updateTokens: jest.fn(),
    existsByNickname: jest.fn(),
  };

  const mockGenerateTokensUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
        {
          provide: GenerateTokensUseCase,
          useValue: mockGenerateTokensUseCase,
        },
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
    jwtService = module.get(JwtService);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
    generateTokensUseCase = module.get(GenerateTokensUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: RefreshTokenCommand = {
      userId: 1,
      refreshToken: 'valid-refresh-token',
    };

    const mockUser = new User(1, 'testuser', 'hashedpassword', UserRole.USER);
    const mockTokenPayload = {
      sub: 1,
      role: UserRole.USER,
    };

    const mockGeneratedTokens: TokensResult = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    };

    it('deve renovar tokens com refresh token válido', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(mockTokenPayload);
      userRepository.findById.mockResolvedValue(mockUser);
      generateTokensUseCase.execute.mockResolvedValue(mockGeneratedTokens);
      userRepository.updateTokens.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(generateTokensUseCase.execute).toHaveBeenCalledWith({
        user: mockUser,
        includeRefreshToken: true,
      });
      expect(userRepository.updateTokens).toHaveBeenCalledWith(1, {
        refreshToken: 'new-refresh-token',
      });
      expect(result).toEqual({
        access_token: 'Bearer new-access-token',
        refresh_token: 'Bearer new-refresh-token',
      });
    });

    it('deve lançar UnauthorizedException para token inválido', async () => {
      // Arrange
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(generateTokensUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando userId não confere', async () => {
      // Arrange
      const invalidPayload = { sub: 999, role: UserRole.USER };
      jwtService.verify.mockReturnValue(invalidPayload);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(generateTokensUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(mockTokenPayload);
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(generateTokensUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve remover prefixo Bearer do token', async () => {
      // Arrange
      const commandWithBearer: RefreshTokenCommand = {
        userId: 1,
        refreshToken: 'Bearer valid-refresh-token',
      };

      jwtService.verify.mockReturnValue(mockTokenPayload);
      userRepository.findById.mockResolvedValue(mockUser);
      generateTokensUseCase.execute.mockResolvedValue(mockGeneratedTokens);
      userRepository.updateTokens.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(commandWithBearer);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual({
        access_token: 'Bearer new-access-token',
        refresh_token: 'Bearer new-refresh-token',
      });
    });

    it('deve tratar erro do repositório', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(mockTokenPayload);
      userRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(generateTokensUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve tratar erro do GenerateTokensUseCase', async () => {
      // Arrange
      jwtService.verify.mockReturnValue(mockTokenPayload);
      userRepository.findById.mockResolvedValue(mockUser);
      generateTokensUseCase.execute.mockRejectedValue(
        new Error('Token generation error'),
      );

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(generateTokensUseCase.execute).toHaveBeenCalledWith({
        user: mockUser,
        includeRefreshToken: true,
      });
    });
  });
});
