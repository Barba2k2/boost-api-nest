import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthenticateCommand,
  AuthenticateUserUseCase,
} from './authenticate-user.use-case';

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    updateTokens: jest.fn(),
    existsByNickname: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateUserUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<AuthenticateUserUseCase>(AuthenticateUserUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: AuthenticateCommand = {
      nickname: 'testuser',
      password: 'plainpassword',
    };

    const mockUser = new User(1, 'testuser', 'hashedpassword', UserRole.USER);

    it('deve retornar usuário quando encontrado', async () => {
      // Arrange
      userRepository.findByNickname.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(userRepository.findByNickname).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(mockUser);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      // Arrange
      userRepository.findByNickname.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(userRepository.findByNickname).toHaveBeenCalledWith('testuser');
    });

    it('deve retornar usuário ADMIN quando encontrado', async () => {
      // Arrange
      const adminUser = new User(2, 'admin', 'adminpass', UserRole.ADMIN);
      const adminCommand = { nickname: 'admin', password: 'adminpass123' };

      userRepository.findByNickname.mockResolvedValue(adminUser);

      // Act
      const result = await useCase.execute(adminCommand);

      // Assert
      expect(userRepository.findByNickname).toHaveBeenCalledWith('admin');
      expect(result).toEqual(adminUser);
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('deve retornar usuário ASSISTANT quando encontrado', async () => {
      // Arrange
      const assistantUser = new User(
        3,
        'assistant',
        'assistantpass',
        UserRole.ASSISTANT,
      );
      const assistantCommand = {
        nickname: 'assistant',
        password: 'assistantpass123',
      };

      userRepository.findByNickname.mockResolvedValue(assistantUser);

      // Act
      const result = await useCase.execute(assistantCommand);

      // Assert
      expect(userRepository.findByNickname).toHaveBeenCalledWith('assistant');
      expect(result).toEqual(assistantUser);
      expect(result.role).toBe(UserRole.ASSISTANT);
    });

    it('deve tratar erro do repositório', async () => {
      // Arrange
      userRepository.findByNickname.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Database error',
      );
      expect(userRepository.findByNickname).toHaveBeenCalledWith('testuser');
    });

    it('deve tratar nickname com diferentes casos', async () => {
      // Arrange
      const command = { nickname: 'TestUser', password: 'anypassword' };
      userRepository.findByNickname.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(userRepository.findByNickname).toHaveBeenCalledWith('TestUser');
      expect(result).toEqual(mockUser);
    });

    it('deve permitir qualquer senha (não validada neste use case)', async () => {
      // Arrange
      const command = { nickname: 'testuser', password: 'wrongpassword' };
      userRepository.findByNickname.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(userRepository.findByNickname).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(mockUser);
    });
  });
});
