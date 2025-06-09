import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { RedisService } from '@infrastructure/cache/redis.service';
import { EmailService } from '@infrastructure/email/email.service';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import {
  ResetPasswordCommand,
  ResetPasswordUseCase,
} from './reset-password.use-case';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let redisService: jest.Mocked<RedisService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByNickname: jest.fn(),
    findByEmail: jest.fn(),
    findByEmailOrNickname: jest.fn(),
    updateTokens: jest.fn(),
    updateLastLogin: jest.fn(),
    updatePassword: jest.fn(),
    updateProfile: jest.fn(),
    existsByNickname: jest.fn(),
    existsByEmail: jest.fn(),
    findUsersWithLogin: jest.fn(),
    countUsersWithLogin: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    useCase = module.get<ResetPasswordUseCase>(ResetPasswordUseCase);
    userRepository = module.get(USER_REPOSITORY_TOKEN);
    redisService = module.get(RedisService);
    emailService = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockedBcrypt.compare.mockClear();
    mockedBcrypt.hash.mockClear();
  });

  describe('execute', () => {
    const mockUser = new User(
      1,
      'testuser',
      'currentHashedPassword',
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

    const validCommand: ResetPasswordCommand = {
      emailOrNickname: 'test@example.com',
      resetToken: 'valid-token-123',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    };

    beforeEach(() => {
      // Setup default mocks
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('valid-token-123');
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false); // Nova senha é diferente
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      userRepository.updatePassword.mockResolvedValue(mockUser);
      redisService.del.mockResolvedValue();
      emailService.sendEmail.mockResolvedValue(true);
    });

    it('deve alterar senha com sucesso', async () => {
      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redisService.get).toHaveBeenCalledWith('password_reset_token:1');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'NewPassword123!',
        'currentHashedPassword',
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
      expect(userRepository.updatePassword).toHaveBeenCalledWith(
        1,
        'newHashedPassword',
      );
      expect(redisService.del).toHaveBeenCalledWith('password_reset_token:1');
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Senha alterada com sucesso - Clã Boost',
        text: expect.stringContaining('Test User'),
        html: expect.stringContaining('Test User'),
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        'Senha alterada com sucesso. Você pode fazer login com a nova senha.',
      );
    });

    it('deve lançar exceção quando senhas não coincidem', async () => {
      // Arrange
      const command: ResetPasswordCommand = {
        ...validCommand,
        confirmPassword: 'DifferentPassword123!',
      };

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(command)).rejects.toThrow(
        'As senhas não coincidem',
      );

      expect(userRepository.findByEmailOrNickname).not.toHaveBeenCalled();
    });

    it('deve lançar exceção quando usuário não existe', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Token inválido ou expirado',
      );

      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redisService.get).not.toHaveBeenCalled();
    });

    it('deve lançar exceção quando token não existe no Redis', async () => {
      // Arrange
      redisService.get.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Token inválido ou expirado',
      );

      expect(redisService.get).toHaveBeenCalledWith('password_reset_token:1');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar exceção quando token não confere', async () => {
      // Arrange
      redisService.get.mockResolvedValue('different-token');

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'Token inválido ou expirado',
      );

      expect(redisService.get).toHaveBeenCalledWith('password_reset_token:1');
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('deve lançar exceção quando nova senha é igual à atual', async () => {
      // Arrange
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true); // Mesma senha

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        'A nova senha deve ser diferente da senha atual',
      );

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        'NewPassword123!',
        'currentHashedPassword',
      );
      expect(userRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('deve funcionar com nickname em vez de email', async () => {
      // Arrange
      const command: ResetPasswordCommand = {
        ...validCommand,
        emailOrNickname: 'testuser',
      };

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'testuser',
      );
      expect(result.success).toBe(true);
    });

    it('deve continuar o processo mesmo se email de confirmação falhar', async () => {
      // Arrange
      emailService.sendEmail.mockRejectedValue(new Error('Email error'));

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(userRepository.updatePassword).toHaveBeenCalled();
      expect(redisService.del).toHaveBeenCalled();
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

  describe('validatePasswordStrength', () => {
    const baseCommand: ResetPasswordCommand = {
      emailOrNickname: 'test@example.com',
      resetToken: 'valid-token',
      newPassword: '',
      confirmPassword: '',
    };

    it('deve aceitar senha forte válida', async () => {
      // Arrange
      const command = {
        ...baseCommand,
        newPassword: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      };

      userRepository.findByEmailOrNickname.mockResolvedValue(
        new User(1, 'test', 'old', UserRole.USER, 'test@example.com', 'Test'),
      );
      redisService.get.mockResolvedValue('valid-token');
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      userRepository.updatePassword.mockResolvedValue({} as User);
      redisService.del.mockResolvedValue();
      emailService.sendEmail.mockResolvedValue(true);

      // Act & Assert
      await expect(useCase.execute(command)).resolves.toBeDefined();
    });

    it('deve rejeitar senha muito curta', async () => {
      // Arrange
      const command = {
        ...baseCommand,
        newPassword: 'Short1!',
        confirmPassword: 'Short1!',
      };

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'A senha deve ter pelo menos 8 caracteres',
      );
    });

    it('deve rejeitar senha sem letra maiúscula', async () => {
      // Arrange
      const command = {
        ...baseCommand,
        newPassword: 'lowercase123!',
        confirmPassword: 'lowercase123!',
      };

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'A senha deve conter pelo menos uma letra maiúscula',
      );
    });

    it('deve rejeitar senha sem letra minúscula', async () => {
      // Arrange
      const command = {
        ...baseCommand,
        newPassword: 'UPPERCASE123!',
        confirmPassword: 'UPPERCASE123!',
      };

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'A senha deve conter pelo menos uma letra minúscula',
      );
    });

    it('deve rejeitar senha sem número', async () => {
      // Arrange
      const command = {
        ...baseCommand,
        newPassword: 'NoNumbersHere!',
        confirmPassword: 'NoNumbersHere!',
      };

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'A senha deve conter pelo menos um número',
      );
    });

    it('deve rejeitar senha sem caractere especial', async () => {
      // Arrange
      const command = {
        ...baseCommand,
        newPassword: 'NoSpecialChar123',
        confirmPassword: 'NoSpecialChar123',
      };

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'A senha deve conter pelo menos um caractere especial',
      );
    });
  });

  describe('sendPasswordChangedNotification', () => {
    it('deve enviar email com HTML e texto corretos', async () => {
      // Arrange
      const mockUser = new User(
        1,
        'testuser',
        'hashedPassword',
        UserRole.USER,
        'test@example.com',
        'John Doe',
      );
      const validCommand: ResetPasswordCommand = {
        emailOrNickname: 'test@example.com',
        resetToken: 'valid-token',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };

      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.get.mockResolvedValue('valid-token');
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      userRepository.updatePassword.mockResolvedValue(mockUser);
      redisService.del.mockResolvedValue();
      emailService.sendEmail.mockResolvedValue(true);

      // Act
      await useCase.execute(validCommand);

      // Assert
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Senha alterada com sucesso - Clã Boost',
        text: expect.stringContaining('John Doe'),
        html: expect.stringContaining('John Doe'),
      });

      const emailCall = emailService.sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Senha alterada com sucesso!');
      expect(emailCall.html).toContain('Boost Team');
      expect(emailCall.text).toContain('Sua senha foi alterada com sucesso');
    });
  });
});
