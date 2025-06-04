import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
  UpdateTokensData,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserTokensUseCase } from './update-user-tokens.use-case';

describe('UpdateUserTokensUseCase', () => {
  let useCase: UpdateUserTokensUseCase;
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
        UpdateUserTokensUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateUserTokensUseCase>(UpdateUserTokensUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockUser = new User(1, 'testuser', 'hashedpassword', UserRole.USER);
    const updatedUser = new User(
      1,
      'testuser',
      'hashedpassword',
      UserRole.USER,
    );

    const validTokens: UpdateTokensData = {
      refreshToken: 'new-refresh-token',
      webToken: 'new-web-token',
      windowsToken: 'new-windows-token',
    };

    it('deve atualizar tokens do usuário quando usuário existe', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateTokens.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(1, validTokens);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.updateTokens).toHaveBeenCalledWith(1, {
        refreshToken: 'new-refresh-token',
        webToken: 'new-web-token',
        windowsToken: 'new-windows-token',
      });
      expect(result).toEqual(updatedUser);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(1, validTokens)).rejects.toThrow(
        new NotFoundException('Usuário com ID 1 não encontrado'),
      );

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.updateTokens).not.toHaveBeenCalled();
    });

    it('deve atualizar apenas refreshToken', async () => {
      // Arrange
      const onlyRefreshToken: UpdateTokensData = {
        refreshToken: 'only-refresh-token',
      };

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateTokens.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(1, onlyRefreshToken);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.updateTokens).toHaveBeenCalledWith(1, {
        refreshToken: 'only-refresh-token',
      });
      expect(result).toEqual(updatedUser);
    });

    it('deve atualizar apenas webToken', async () => {
      // Arrange
      const onlyWebToken: UpdateTokensData = {
        webToken: 'only-web-token',
      };

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateTokens.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(1, onlyWebToken);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.updateTokens).toHaveBeenCalledWith(1, {
        webToken: 'only-web-token',
      });
      expect(result).toEqual(updatedUser);
    });

    it('deve atualizar apenas windowsToken', async () => {
      // Arrange
      const onlyWindowsToken: UpdateTokensData = {
        windowsToken: 'only-windows-token',
      };

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateTokens.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(1, onlyWindowsToken);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.updateTokens).toHaveBeenCalledWith(1, {
        windowsToken: 'only-windows-token',
      });
      expect(result).toEqual(updatedUser);
    });

    it('deve atualizar tokens para usuário ADMIN', async () => {
      // Arrange
      const adminUser = new User(2, 'admin', 'adminpass', UserRole.ADMIN);
      const adminTokens: UpdateTokensData = {
        refreshToken: 'admin-refresh-token',
        webToken: 'admin-web-token',
        windowsToken: 'admin-windows-token',
      };

      userRepository.findById.mockResolvedValue(adminUser);
      userRepository.updateTokens.mockResolvedValue(adminUser);

      // Act
      const result = await useCase.execute(2, adminTokens);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(2);
      expect(userRepository.updateTokens).toHaveBeenCalledWith(2, {
        refreshToken: 'admin-refresh-token',
        webToken: 'admin-web-token',
        windowsToken: 'admin-windows-token',
      });
      expect(result).toEqual(adminUser);
    });

    it('deve atualizar tokens para usuário ASSISTANT', async () => {
      // Arrange
      const assistantUser = new User(
        3,
        'assistant',
        'assistantpass',
        UserRole.ASSISTANT,
      );
      const assistantTokens: UpdateTokensData = {
        refreshToken: 'assistant-refresh-token',
        webToken: 'assistant-web-token',
        windowsToken: 'assistant-windows-token',
      };

      userRepository.findById.mockResolvedValue(assistantUser);
      userRepository.updateTokens.mockResolvedValue(assistantUser);

      // Act
      const result = await useCase.execute(3, assistantTokens);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(3);
      expect(userRepository.updateTokens).toHaveBeenCalledWith(3, {
        refreshToken: 'assistant-refresh-token',
        webToken: 'assistant-web-token',
        windowsToken: 'assistant-windows-token',
      });
      expect(result).toEqual(assistantUser);
    });

    it('deve tratar erro do repositório ao buscar usuário', async () => {
      // Arrange
      userRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(useCase.execute(1, validTokens)).rejects.toThrow(
        'Database error',
      );
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.updateTokens).not.toHaveBeenCalled();
    });

    it('deve tratar erro do repositório ao atualizar tokens', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateTokens.mockRejectedValue(new Error('Update error'));

      // Act & Assert
      await expect(useCase.execute(1, validTokens)).rejects.toThrow(
        'Update error',
      );
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.updateTokens).toHaveBeenCalledWith(1, {
        refreshToken: 'new-refresh-token',
        webToken: 'new-web-token',
        windowsToken: 'new-windows-token',
      });
    });

    it('deve lidar com tokens vazios', async () => {
      // Arrange
      const emptyTokens: UpdateTokensData = {};

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateTokens.mockResolvedValue(updatedUser);

      // Act
      const result = await useCase.execute(1, emptyTokens);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.updateTokens).toHaveBeenCalledWith(1, {});
      expect(result).toEqual(updatedUser);
    });
  });
});
