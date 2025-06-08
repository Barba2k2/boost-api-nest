import { CreateUserUseCase } from '@application/use-cases/user/create-user.use-case';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { UpdateUserTokensUseCase } from '@application/use-cases/user/update-user-tokens.use-case';
import { User, UserRole } from '@domain/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from '@presentation/dto/user/create-user.dto';
import { UpdateTokensDto } from '@presentation/dto/user/update-tokens.dto';
import { RateLimitService } from '../../infrastructure/cache/rate-limit.service';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let getUserByIdUseCase: jest.Mocked<GetUserByIdUseCase>;
  let updateUserTokensUseCase: jest.Mocked<UpdateUserTokensUseCase>;

  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  const mockGetUserByIdUseCase = {
    execute: jest.fn(),
  };

  const mockUpdateUserTokensUseCase = {
    execute: jest.fn(),
  };

  const mockRateLimitService = {
    checkLoginRateLimit: jest.fn(),
    isTemporarilyBlocked: jest.fn(),
    incrementFailedAttempts: jest.fn(),
    clearFailedAttempts: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        {
          provide: GetUserByIdUseCase,
          useValue: mockGetUserByIdUseCase,
        },
        {
          provide: UpdateUserTokensUseCase,
          useValue: mockUpdateUserTokensUseCase,
        },
        {
          provide: RateLimitService,
          useValue: mockRateLimitService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    createUserUseCase = module.get(CreateUserUseCase);
    getUserByIdUseCase = module.get(GetUserByIdUseCase);
    updateUserTokensUseCase = module.get(UpdateUserTokensUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      fullName: 'Test User',
      nickname: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER,
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

    it('deve criar um usuário com sucesso', async () => {
      // Arrange
      createUserUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await controller.create(createUserDto);

      // Assert
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      });
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('testuser');
      expect(result.role).toBe(UserRole.USER);
      // Password não é retornada no DTO
    });

    it('deve propagar ConflictException quando usuário já existe', async () => {
      // Arrange
      createUserUseCase.execute.mockRejectedValue(
        new ConflictException('Usuário com este nickname já existe'),
      );

      // Act & Assert
      await expect(controller.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        fullName: 'Test User',
        nickname: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.USER,
      });
    });
  });

  describe('findById', () => {
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

    it('deve retornar um usuário por ID', async () => {
      // Arrange
      getUserByIdUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await controller.findById(1);

      // Assert
      expect(getUserByIdUseCase.execute).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('testuser');
      expect(result.role).toBe(UserRole.USER);
      // Password não é retornada no DTO
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      // Arrange
      getUserByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Usuário não encontrado'),
      );

      // Act & Assert
      await expect(controller.findById(999)).rejects.toThrow(NotFoundException);
      expect(getUserByIdUseCase.execute).toHaveBeenCalledWith(999);
    });
  });

  describe('updateTokens', () => {
    const updateTokensDto: UpdateTokensDto = {
      refreshToken: 'new-refresh-token',
      webToken: 'new-web-token',
      windowsToken: 'new-windows-token',
    };

    const mockUpdatedUser = new User(
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

    it('deve atualizar tokens do usuário com sucesso', async () => {
      // Arrange
      updateUserTokensUseCase.execute.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await controller.updateTokens(1, updateTokensDto);

      // Assert
      expect(updateUserTokensUseCase.execute).toHaveBeenCalledWith(1, {
        refreshToken: 'new-refresh-token',
        webToken: 'new-web-token',
        windowsToken: 'new-windows-token',
      });
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('testuser');
      expect(result.role).toBe(UserRole.USER);
      // Password não é retornada no DTO
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      // Arrange
      updateUserTokensUseCase.execute.mockRejectedValue(
        new NotFoundException('Usuário não encontrado'),
      );

      // Act & Assert
      await expect(
        controller.updateTokens(999, updateTokensDto),
      ).rejects.toThrow(NotFoundException);
      expect(updateUserTokensUseCase.execute).toHaveBeenCalledWith(
        999,
        updateTokensDto,
      );
    });

    it('deve atualizar apenas alguns tokens', async () => {
      // Arrange
      const partialUpdateDto: UpdateTokensDto = {
        refreshToken: 'new-refresh-token',
      };
      updateUserTokensUseCase.execute.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await controller.updateTokens(1, partialUpdateDto);

      // Assert
      expect(updateUserTokensUseCase.execute).toHaveBeenCalledWith(1, {
        refreshToken: 'new-refresh-token',
      });
      expect(result).toBeDefined();
    });
  });
});
