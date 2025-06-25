import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { RedisService } from '@infrastructure/cache/redis.service';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ValidatePasswordResetPinCommand,
  ValidatePasswordResetPinUseCase,
} from './validate-password-reset-pin.use-case';

describe('ValidatePasswordResetPinUseCase', () => {
  let useCase: ValidatePasswordResetPinUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let redisService: jest.Mocked<RedisService>;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    findByEmailOrNickname: jest.fn(),
    updateTokens: jest.fn(),
    existsByNickname: jest.fn(),
    existsByEmail: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidatePasswordResetPinUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    useCase = module.get<ValidatePasswordResetPinUseCase>(
      ValidatePasswordResetPinUseCase,
    );
    userRepository = module.get(USER_REPOSITORY_TOKEN);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
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

    const validCommand: ValidatePasswordResetPinCommand = {
      emailOrNickname: 'test@example.com',
      pin: '123456',
    };

    it('deve validar PIN com sucesso e retornar token de reset', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('123456');
      redisService.setex.mockResolvedValue();
      redisService.del.mockResolvedValue();

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redisService.get).toHaveBeenCalledWith('password_reset_pin:1');
      expect(redisService.setex).toHaveBeenCalledWith(
        'password_reset_token:1',
        1800, // 30 minutos
        expect.any(String),
      );
      expect(redisService.del).toHaveBeenCalledWith('password_reset_pin:1');

      expect(result.valid).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(32);
      expect(result.message).toBe(
        'PIN validado com sucesso. Você pode agora definir uma nova senha.',
      );
    });

    it('deve lançar exceção quando usuário não existe', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'PIN inválido ou expirado',
      );

      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('deve lançar exceção quando PIN não existe no Redis', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'PIN inválido ou expirado',
      );

      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redisService.get).toHaveBeenCalledWith('password_reset_pin:1');
      expect(redisService.setex).not.toHaveBeenCalled();
    });

    it('deve lançar exceção quando PIN não confere', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('654321'); // PIN diferente

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'PIN inválido ou expirado',
      );

      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redisService.get).toHaveBeenCalledWith('password_reset_pin:1');
      expect(redisService.setex).not.toHaveBeenCalled();
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('deve funcionar com nickname em vez de email', async () => {
      // Arrange
      const commandWithNickname: ValidatePasswordResetPinCommand = {
        emailOrNickname: 'testuser',
        pin: '123456',
      };

      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('123456');
      redisService.setex.mockResolvedValue();
      redisService.del.mockResolvedValue();

      // Act
      const result = await useCase.execute(commandWithNickname);

      // Assert
      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'testuser',
      );
      expect(result.valid).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('deve gerar tokens diferentes em chamadas consecutivas', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('123456');
      redisService.setex.mockResolvedValue();
      redisService.del.mockResolvedValue();

      // Act
      const result1 = await useCase.execute(validCommand);
      const result2 = await useCase.execute(validCommand);

      // Assert
      expect(result1.token).toBeDefined();
      expect(result2.token).toBeDefined();
      expect(result1.token).not.toBe(result2.token);
    });

    it('deve tratar erros inesperados e lançar BadRequestException genérica', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Erro interno. Tente novamente mais tarde.',
      );
    });
  });

  describe('generateResetToken', () => {
    it('deve gerar token de 32 caracteres', async () => {
      // Arrange
      const mockUser = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.USER,
        'test@example.com',
        'Test User',
        true,
      );
      const validCommand: ValidatePasswordResetPinCommand = {
        emailOrNickname: 'test@example.com',
        pin: '123456',
      };

      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('123456');
      redisService.setex.mockResolvedValue();
      redisService.del.mockResolvedValue();

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.token).toHaveLength(32);
      expect(result.token).toMatch(/^[A-Za-z0-9]+$/); // Apenas letras e números
    });
  });
});
