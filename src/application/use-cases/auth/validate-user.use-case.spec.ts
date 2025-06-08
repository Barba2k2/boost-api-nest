import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import {
  ValidateUserCommand,
  ValidateUserUseCase,
} from './validate-user.use-case';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('ValidateUserUseCase', () => {
  let useCase: ValidateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    findByEmailOrNickname: jest.fn(),
    updateTokens: jest.fn(),
    existsByNickname: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateUserUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<ValidateUserUseCase>(ValidateUserUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: ValidateUserCommand = {
      emailOrNickname: 'testuser',
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

    it('deve validar usuário com credenciais corretas', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'testuser',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainpassword',
        'hashedpassword',
      );
      expect(result).toEqual(mockUser);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Usuário não encontrado ou senha inválida'),
      );

      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'testuser',
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando senha está incorreta', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new UnauthorizedException('Usuário não encontrado ou senha inválida'),
      );

      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'testuser',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainpassword',
        'hashedpassword',
      );
    });

    it('deve validar diferentes tipos de usuário', async () => {
      // Arrange - Admin User
      const adminUser = new User(
        1,
        'admin',
        'hashedpassword',
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
      userRepository.findByEmailOrNickname.mockResolvedValue(adminUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await useCase.execute({
        emailOrNickname: 'admin',
        password: 'plainpassword',
      });

      // Assert
      expect(result).toEqual(adminUser);
      expect(result.isAdmin()).toBe(true);
    });

    it('deve validar usuário assistant', async () => {
      // Arrange - Assistant User
      const assistantUser = new User(
        1,
        'assistant',
        'hashedpassword',
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
      userRepository.findByEmailOrNickname.mockResolvedValue(assistantUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await useCase.execute({
        emailOrNickname: 'assistant',
        password: 'plainpassword',
      });

      // Assert
      expect(result).toEqual(assistantUser);
      expect(result.isAssistant()).toBe(true);
    });
  });
});
