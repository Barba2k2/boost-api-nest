import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { ChangePasswordUseCase } from './change-password.use-case';

// Mock do bcrypt
jest.mock('bcrypt');

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUserRepository = {
    findById: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findByNickname: jest.fn(),
    findByEmail: jest.fn(),
    updateTokens: jest.fn(),
    updateLastLogin: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockUser = new User(
    1,
    'testuser',
    'hashedOldPassword',
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
        ChangePasswordUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<ChangePasswordUseCase>(ChangePasswordUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);

    // Reset dos mocks
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockClear();
    (bcrypt.hash as jest.Mock).mockClear();
  });

  describe('execute', () => {
    const changePasswordDto = {
      userId: 1,
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword456',
      confirmPassword: 'newPassword456',
    };

    it('deve alterar a senha com sucesso', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      // Primeira chamada (verificar senha atual): true
      // Segunda chamada (verificar se nova senha é diferente): false
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // senha atual correta
        .mockResolvedValueOnce(false); // nova senha é diferente da atual
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');

      const updatedUser = new User(
        1,
        'testuser',
        'hashedNewPassword',
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
      mockUserRepository.updatePassword.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(changePasswordDto);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'currentPassword123',
        'hashedOldPassword',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword456', 10);
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        1,
        'hashedNewPassword',
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(changePasswordDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando senha atual está incorreta', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(changePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'currentPassword123',
        'hashedOldPassword',
      );
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando nova senha e confirmação não conferem', async () => {
      // Arrange
      const invalidDto = {
        ...changePasswordDto,
        confirmPassword: 'differentPassword',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'currentPassword123',
        'hashedOldPassword',
      );
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando nova senha é igual à atual', async () => {
      // Arrange
      const samePasswordDto = {
        userId: 1,
        currentPassword: 'samePassword123',
        newPassword: 'samePassword123',
        confirmPassword: 'samePassword123',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(useCase.execute(samePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'samePassword123',
        'hashedOldPassword',
      );
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });
});
