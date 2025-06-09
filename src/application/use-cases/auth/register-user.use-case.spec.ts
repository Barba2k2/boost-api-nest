import { CreateUserUseCase } from '@application/use-cases/user/create-user.use-case';
import { User, UserRole } from '@domain/entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import {
  RegisterUserCommand,
  RegisterUserUseCase,
} from './register-user.use-case';
import { SendWelcomeEmailUseCase } from './send-welcome-email.use-case';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;

  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  const mockSendWelcomeEmailUseCase = {
    execute: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        {
          provide: SendWelcomeEmailUseCase,
          useValue: mockSendWelcomeEmailUseCase,
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
      fullName: 'Test User',
      nickname: 'testuser',
      email: 'test@example.com',
      password: 'plainpassword',
      confirmPassword: 'plainpassword',
      role: UserRole.USER,
    };

    const mockUser = new User(
      1,
      'testuser',
      'hashedpassword',
      UserRole.USER,
      'test@example.com',
      'Test User',
    );

    it('deve registrar um usuário com senha hasheada', async () => {
      // Arrange
      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: UserRole.USER,
      });
      expect(result).toEqual(mockUser);
    });

    it('deve registrar usuário ADMIN', async () => {
      // Arrange
      const adminCommand = { ...validCommand, role: UserRole.ADMIN };
      const adminUser = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.ADMIN,
        'test@example.com',
        'Test User',
      );

      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(adminUser);

      // Act
      const result = await useCase.execute(adminCommand);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
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
        'testuser',
        'hashedpassword',
        UserRole.ASSISTANT,
        'test@example.com',
        'Test User',
      );

      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(assistantUser);

      // Act
      const result = await useCase.execute(assistantCommand);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
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
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
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

    it('deve lançar erro quando senhas não coincidem', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        confirmPassword: 'differentpassword',
      };

      // Act & Assert
      await expect(useCase.execute(invalidCommand)).rejects.toThrow(
        'As senhas não coincidem',
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(createUserUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve usar role USER como padrão quando não especificado', async () => {
      // Arrange
      const commandWithoutRole = {
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'plainpassword',
        confirmPassword: 'plainpassword',
      };

      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(commandWithoutRole);

      // Assert
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: UserRole.USER, // Deve usar USER como padrão
      });
      expect(result).toEqual(mockUser);
    });

    it('deve continuar execução mesmo se envio de email falhar', async () => {
      // Arrange
      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(mockUser);
      mockSendWelcomeEmailUseCase.execute.mockRejectedValue(
        new Error('Email service error'),
      );

      const loggerSpy = jest
        .spyOn(useCase['logger'], 'error')
        .mockImplementation();

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockSendWelcomeEmailUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        userName: 'Test User',
      });

      // Aguardar que o catch seja executado
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(loggerSpy).toHaveBeenCalledWith(
        'Falha ao enviar email de boas-vindas para test@example.com:',
        expect.any(Error),
      );

      loggerSpy.mockRestore();
    });

    it('deve enviar email de boas-vindas com sucesso', async () => {
      // Arrange
      mockedBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      createUserUseCase.execute.mockResolvedValue(mockUser);
      mockSendWelcomeEmailUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockSendWelcomeEmailUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        userName: 'Test User',
      });
    });
  });
});
