import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProfileUseCase } from './update-profile.use-case';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUserRepository = {
    findById: jest.fn(),
    update: jest.fn(),
    updateProfile: jest.fn(),
    create: jest.fn(),
    findByNickname: jest.fn(),
    findByEmail: jest.fn(),
    updateTokens: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockUser = new User(
    1,
    'testuser',
    'hashedPassword',
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfileUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateProfileUseCase>(UpdateProfileUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    const updateProfileDto = {
      userId: 1,
      fullName: 'Updated Name',
      email: 'updated@example.com',
      nickname: 'updateduser',
    };

    it('deve atualizar o perfil com sucesso', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByNickname.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const updatedUser = new User(
        1,
        'updateduser',
        'hashedPassword',
        UserRole.USER,
        'updated@example.com',
        'Updated Name',
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
        new Date(),
      );
      mockUserRepository.updateProfile.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(updateProfileDto);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.findByNickname).toHaveBeenCalledWith(
        'updateduser',
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'updated@example.com',
      );
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith(1, {
        fullName: 'Updated Name',
        email: 'updated@example.com',
        nickname: 'updateduser',
      });
      expect(result).toBeDefined();
      expect(result.nickname).toBe('updateduser');
      expect(result.email).toBe('updated@example.com');
      expect(result.fullName).toBe('Updated Name');
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(updateProfileDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando nickname já está em uso por outro usuário', async () => {
      // Arrange
      const anotherUser = new User(
        2,
        'updateduser',
        'hashedPassword',
        UserRole.USER,
        'another@example.com',
        'Another User',
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
        new Date(),
      );

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByNickname.mockResolvedValue(anotherUser);

      // Act & Assert
      await expect(useCase.execute(updateProfileDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.findByNickname).toHaveBeenCalledWith(
        'updateduser',
      );
      expect(mockUserRepository.updateProfile).not.toHaveBeenCalled();
    });
  });
});
