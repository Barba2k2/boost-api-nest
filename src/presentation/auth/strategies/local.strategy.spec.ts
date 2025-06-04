import { ValidateUserUseCase } from '@application/use-cases/auth/validate-user.use-case';
import { User, UserRole } from '@domain/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let mockValidateUserUseCase: any;

  const mockUser = new User(1, 'testuser', 'hashedpassword', UserRole.USER);

  beforeEach(async () => {
    mockValidateUserUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: ValidateUserUseCase,
          useValue: mockValidateUserUseCase,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('deve retornar usuário quando credenciais são válidas', async () => {
      // Arrange
      const nickname = 'testuser';
      const password = 'password123';

      mockValidateUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(nickname, password);

      // Assert
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname,
        password,
      });
      expect(result).toEqual(mockUser);
    });

    it('deve lançar UnauthorizedException quando usuário não é encontrado', async () => {
      // Arrange
      const nickname = 'nonexistent';
      const password = 'password123';

      mockValidateUserUseCase.execute.mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(nickname, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname,
        password,
      });
    });

    it('deve lançar UnauthorizedException quando usuário é undefined', async () => {
      // Arrange
      const nickname = 'testuser';
      const password = 'wrongpassword';

      mockValidateUserUseCase.execute.mockResolvedValue(undefined);

      // Act & Assert
      await expect(strategy.validate(nickname, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname,
        password,
      });
    });

    it('deve propagar erro do ValidateUserUseCase', async () => {
      // Arrange
      const nickname = 'testuser';
      const password = 'password123';

      const error = new Error('Database connection failed');
      mockValidateUserUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(strategy.validate(nickname, password)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname,
        password,
      });
    });

    it('deve funcionar com diferentes tipos de usuário', async () => {
      // Arrange - Admin
      const adminUser = new User(2, 'admin', 'hashedpass', UserRole.ADMIN);
      mockValidateUserUseCase.execute.mockResolvedValue(adminUser);

      // Act
      const result = await strategy.validate('admin', 'adminpass');

      // Assert
      expect(result).toEqual(adminUser);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('deve funcionar com assistant user', async () => {
      // Arrange - Assistant
      const assistantUser = new User(
        3,
        'assistant',
        'hashedpass',
        UserRole.ASSISTANT,
      );
      mockValidateUserUseCase.execute.mockResolvedValue(assistantUser);

      // Act
      const result = await strategy.validate('assistant', 'assistantpass');

      // Assert
      expect(result).toEqual(assistantUser);
      expect(result.role).toBe(UserRole.ASSISTANT);
    });

    it('deve lidar com strings vazias', async () => {
      // Arrange
      const nickname = '';
      const password = '';

      mockValidateUserUseCase.execute.mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(nickname, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname: '',
        password: '',
      });
    });

    it('deve lidar com espaços em branco', async () => {
      // Arrange
      const nickname = '  testuser  ';
      const password = '  password123  ';

      mockValidateUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(nickname, password);

      // Assert
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname: '  testuser  ',
        password: '  password123  ',
      });
      expect(result).toEqual(mockUser);
    });

    it('deve lidar com caracteres especiais', async () => {
      // Arrange
      const nickname = 'test@user.com';
      const password = 'p@ssw0rd!#$';

      mockValidateUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await strategy.validate(nickname, password);

      // Assert
      expect(mockValidateUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'test@user.com',
        password: 'p@ssw0rd!#$',
      });
      expect(result).toEqual(mockUser);
    });

    it('deve retornar usuário com tokens quando presentes', async () => {
      // Arrange
      const userWithTokens = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.USER,
        'refresh-token',
        'web-token',
        'windows-token',
        new Date(),
        new Date(),
      );

      mockValidateUserUseCase.execute.mockResolvedValue(userWithTokens);

      // Act
      const result = await strategy.validate('testuser', 'password123');

      // Assert
      expect(result).toEqual(userWithTokens);
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.webToken).toBe('web-token');
      expect(result.windowsToken).toBe('windows-token');
    });
  });
});
