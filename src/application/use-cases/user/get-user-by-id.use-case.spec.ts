import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';

describe('GetUserByIdUseCase', () => {
  let useCase: GetUserByIdUseCase;
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
        GetUserByIdUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUserByIdUseCase>(GetUserByIdUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockUser = new User(1, 'testuser', 'hashedpassword', UserRole.USER);

    it('deve retornar usuário quando encontrado', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute(1);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(1)).rejects.toThrow(
        new NotFoundException('Usuário com ID 1 não encontrado'),
      );

      expect(userRepository.findById).toHaveBeenCalledWith(1);
    });

    it('deve retornar usuário ADMIN quando encontrado', async () => {
      // Arrange
      const adminUser = new User(2, 'admin', 'adminpass', UserRole.ADMIN);
      userRepository.findById.mockResolvedValue(adminUser);

      // Act
      const result = await useCase.execute(2);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(2);
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
      userRepository.findById.mockResolvedValue(assistantUser);

      // Act
      const result = await useCase.execute(3);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(3);
      expect(result).toEqual(assistantUser);
      expect(result.role).toBe(UserRole.ASSISTANT);
    });

    it('deve tratar erro do repositório', async () => {
      // Arrange
      userRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(1)).rejects.toThrow('Database error');
      expect(userRepository.findById).toHaveBeenCalledWith(1);
    });

    it('deve buscar usuário com ID zero', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(0)).rejects.toThrow(
        new NotFoundException('Usuário com ID 0 não encontrado'),
      );
      expect(userRepository.findById).toHaveBeenCalledWith(0);
    });

    it('deve buscar usuário com ID negativo', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(-1)).rejects.toThrow(
        new NotFoundException('Usuário com ID -1 não encontrado'),
      );
      expect(userRepository.findById).toHaveBeenCalledWith(-1);
    });

    it('deve buscar usuário com ID muito alto', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(999999)).rejects.toThrow(
        new NotFoundException('Usuário com ID 999999 não encontrado'),
      );
      expect(userRepository.findById).toHaveBeenCalledWith(999999);
    });
  });
});
