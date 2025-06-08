import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateLastLoginUseCase } from './update-last-login.use-case';

describe('UpdateLastLoginUseCase', () => {
  let useCase: UpdateLastLoginUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    updateTokens: jest.fn(),
    updateLastLogin: jest.fn(),
    existsByNickname: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateLastLoginUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateLastLoginUseCase>(UpdateLastLoginUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('deve atualizar o último login do usuário com sucesso', async () => {
      // Arrange
      const userId = 1;
      const updatedUser = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.USER,
        'test@example.com',
        'Test User',
        undefined,
        undefined,
        undefined,
        new Date('2024-01-01T12:00:00Z'),
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-01-01T12:00:00Z'),
      );

      userRepository.updateLastLogin.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(userId);
      expect(result).toBe(updatedUser);
      expect(result.lastLogin).toBeDefined();
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      const userId = 1;
      const error = new Error('Database error');
      userRepository.updateLastLogin.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(userId)).rejects.toThrow('Database error');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(userId);
    });

    it('deve funcionar com diferentes IDs de usuário', async () => {
      // Arrange
      const userId = 999;
      const updatedUser = new User(
        999,
        'anotheruser',
        'hashedpassword',
        UserRole.ADMIN,
        'another@example.com',
        'Another User',
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
        new Date(),
      );

      userRepository.updateLastLogin.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(userId);

      // Assert
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(999);
      expect(result.id).toBe(999);
    });
  });
});
