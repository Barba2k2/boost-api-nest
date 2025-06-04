import { CreateUserUseCase } from '@application/use-cases/user/create-user.use-case';
import { User, UserRole } from '@domain/entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import {
  RegisterUserCommand,
  RegisterUserUseCase,
} from './register-user.use-case';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;

  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    createUserUseCase = module.get(CreateUserUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: RegisterUserCommand = {
      nickname: 'testuser',
      password: 'plainpassword',
      role: UserRole.USER,
    };

    const mockUser = new User(1, 'testuser', 'hashedpassword', UserRole.USER);

    it('deve registrar um usuário com senha hasheada', async () => {
      // Arrange
      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'testuser',
        password: 'hashedpassword',
        role: UserRole.USER,
      });
      expect(result).toEqual(mockUser);
    });

    it('deve registrar usuário ADMIN', async () => {
      // Arrange
      const adminCommand = { ...validCommand, role: UserRole.ADMIN };
      const adminUser = new User(1, 'admin', 'hashedpassword', UserRole.ADMIN);

      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(adminUser);

      // Act
      const result = await useCase.execute(adminCommand);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'testuser',
        password: 'hashedpassword',
        role: UserRole.ADMIN,
      });
      expect(result).toEqual(adminUser);
    });

    it('deve registrar usuário ASSISTANT', async () => {
      // Arrange
      const assistantCommand = { ...validCommand, role: UserRole.ASSISTANT };
      const assistantUser = new User(
        1,
        'assistant',
        'hashedpassword',
        UserRole.ASSISTANT,
      );

      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(assistantUser);

      // Act
      const result = await useCase.execute(assistantCommand);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'testuser',
        password: 'hashedpassword',
        role: UserRole.ASSISTANT,
      });
      expect(result).toEqual(assistantUser);
    });

    it('deve propagar ConflictException do CreateUserUseCase', async () => {
      // Arrange
      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockRejectedValue(
        new ConflictException('Usuário já existe'),
      );

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        new ConflictException('Usuário já existe'),
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        nickname: 'testuser',
        password: 'hashedpassword',
        role: UserRole.USER,
      });
    });

    it('deve tratar erro do bcrypt', async () => {
      // Arrange
      mockedBcrypt.hash.mockRejectedValue(new Error('Hash error') as never);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow('Hash error');
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(createUserUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
