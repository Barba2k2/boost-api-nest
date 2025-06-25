import { ChangePasswordUseCase } from '@application/use-cases/user/change-password.use-case';
import { CreateUserUseCase } from '@application/use-cases/user/create-user.use-case';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { UpdateProfileUseCase } from '@application/use-cases/user/update-profile.use-case';
import { UpdateUserTokensUseCase } from '@application/use-cases/user/update-user-tokens.use-case';
import { User, UserRole } from '@domain/entities/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ChangePasswordDto } from '@presentation/dto/user/change-password.dto';
import { CreateUserDto } from '@presentation/dto/user/create-user.dto';
import { UpdateProfileDto } from '@presentation/dto/user/update-profile.dto';
import { UpdateTokensDto } from '@presentation/dto/user/update-tokens.dto';
import { RateLimitService } from '../../infrastructure/cache/rate-limit.service';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let getUserByIdUseCase: jest.Mocked<GetUserByIdUseCase>;
  let updateUserTokensUseCase: jest.Mocked<UpdateUserTokensUseCase>;
  let updateProfileUseCase: jest.Mocked<UpdateProfileUseCase>;
  let changePasswordUseCase: jest.Mocked<ChangePasswordUseCase>;

  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  const mockGetUserByIdUseCase = {
    execute: jest.fn(),
  };

  const mockUpdateUserTokensUseCase = {
    execute: jest.fn(),
  };

  const mockUpdateProfileUseCase = {
    execute: jest.fn(),
  };

  const mockChangePasswordUseCase = {
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
          provide: UpdateProfileUseCase,
          useValue: mockUpdateProfileUseCase,
        },
        {
          provide: ChangePasswordUseCase,
          useValue: mockChangePasswordUseCase,
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
    updateProfileUseCase = module.get(UpdateProfileUseCase);
    changePasswordUseCase = module.get(ChangePasswordUseCase);
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
      true,
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
      true,
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
      true,
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

  describe('getMyProfile', () => {
    const mockUser = new User(
      1,
      'testuser',
      'hashedpassword',
      UserRole.USER,
      'test@example.com',
      'Test User',
      true,
      undefined,
      undefined,
      undefined,
      new Date(),
      new Date(),
      new Date(),
    );

    const mockReq = {
      user: { sub: 1 },
    };

    it('deve retornar o perfil do usuário autenticado', async () => {
      // Arrange
      getUserByIdUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getMyProfile(mockReq);

      // Assert
      expect(getUserByIdUseCase.execute).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('testuser');
      expect(result.email).toBe('test@example.com');
    });

    it('deve propagar NotFoundException quando usuário não existe', async () => {
      // Arrange
      getUserByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Usuário não encontrado'),
      );

      // Act & Assert
      await expect(controller.getMyProfile(mockReq)).rejects.toThrow(
        NotFoundException,
      );
      expect(getUserByIdUseCase.execute).toHaveBeenCalledWith(1);
    });
  });

  describe('updateMyProfile', () => {
    const updateProfileDto: UpdateProfileDto = {
      fullName: 'Updated Name',
      nickname: 'updateduser',
      email: 'updated@example.com',
      phone: '123456789',
    };

    const mockUser = new User(
      1,
      'updateduser',
      'hashedpassword',
      UserRole.USER,
      'updated@example.com',
      'Updated Name',
      true,
      undefined,
      undefined,
      undefined,
      new Date(),
      new Date(),
      new Date(),
    );

    const mockReq = {
      user: { sub: 1 },
    };

    it('deve atualizar o perfil do usuário autenticado', async () => {
      // Arrange
      updateProfileUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await controller.updateMyProfile(
        mockReq,
        updateProfileDto,
      );

      // Assert
      expect(updateProfileUseCase.execute).toHaveBeenCalledWith({
        userId: 1,
        fullName: 'Updated Name',
        nickname: 'updateduser',
        email: 'updated@example.com',
        phone: '123456789',
      });
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('updateduser');
      expect(result.email).toBe('updated@example.com');
      expect(result.fullName).toBe('Updated Name');
    });

    it('deve propagar ConflictException quando nickname já existe', async () => {
      // Arrange
      updateProfileUseCase.execute.mockRejectedValue(
        new ConflictException('Nickname já está em uso'),
      );

      // Act & Assert
      await expect(
        controller.updateMyProfile(mockReq, updateProfileDto),
      ).rejects.toThrow(ConflictException);
      expect(updateProfileUseCase.execute).toHaveBeenCalledWith({
        userId: 1,
        fullName: 'Updated Name',
        nickname: 'updateduser',
        email: 'updated@example.com',
        phone: '123456789',
      });
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      // Arrange
      const partialUpdateDto: UpdateProfileDto = {
        fullName: 'Only Name Updated',
      };
      const mockUpdatedUser = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.USER,
        'test@example.com',
        'Only Name Updated',
        true,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
        new Date(),
      );
      updateProfileUseCase.execute.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await controller.updateMyProfile(
        mockReq,
        partialUpdateDto,
      );

      // Assert
      expect(updateProfileUseCase.execute).toHaveBeenCalledWith({
        userId: 1,
        fullName: 'Only Name Updated',
        nickname: undefined,
        email: undefined,
        phone: undefined,
      });
      expect(result.fullName).toBe('Only Name Updated');
    });
  });

  describe('changeMyPassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    };

    const mockUser = new User(
      1,
      'testuser',
      'hashedpassword',
      UserRole.USER,
      'test@example.com',
      'Test User',
      true,
      undefined,
      undefined,
      undefined,
      new Date(),
      new Date(),
      new Date(),
    );

    const mockReq = {
      user: { sub: 1 },
    };

    it('deve alterar a senha do usuário autenticado', async () => {
      // Arrange
      changePasswordUseCase.execute.mockResolvedValue(mockUser);

      // Act
      const result = await controller.changeMyPassword(
        mockReq,
        changePasswordDto,
      );

      // Assert
      expect(changePasswordUseCase.execute).toHaveBeenCalledWith({
        userId: 1,
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      });
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('testuser');
    });

    it('deve propagar UnauthorizedException quando senha atual incorreta', async () => {
      // Arrange
      changePasswordUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Senha atual incorreta'),
      );

      // Act & Assert
      await expect(
        controller.changeMyPassword(mockReq, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(changePasswordUseCase.execute).toHaveBeenCalledWith({
        userId: 1,
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      });
    });

    it('deve propagar BadRequestException quando senhas não coincidem', async () => {
      // Arrange
      const invalidDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword',
      };
      changePasswordUseCase.execute.mockRejectedValue(
        new BadRequestException('As senhas não coincidem'),
      );

      // Act & Assert
      await expect(
        controller.changeMyPassword(mockReq, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve propagar BadRequestException quando nova senha é inválida', async () => {
      // Arrange
      const invalidDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: '123', // senha muito simples
        confirmPassword: '123',
      };
      changePasswordUseCase.execute.mockRejectedValue(
        new BadRequestException('A senha deve ter pelo menos 8 caracteres'),
      );

      // Act & Assert
      await expect(
        controller.changeMyPassword(mockReq, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
