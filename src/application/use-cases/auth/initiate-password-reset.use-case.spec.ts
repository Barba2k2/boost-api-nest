import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User, UserRole } from '@domain/entities/user.entity';
import { RedisService } from '@infrastructure/cache/redis.service';
import { EmailService } from '@infrastructure/email/email.service';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InitiatePasswordResetCommand,
  InitiatePasswordResetUseCase,
} from './initiate-password-reset.use-case';

describe('InitiatePasswordResetUseCase', () => {
  let useCase: InitiatePasswordResetUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let redisService: jest.Mocked<RedisService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUserRepository = {
    findByEmailOrNickname: jest.fn(),
  };

  const mockRedisService = {
    setex: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiatePasswordResetUseCase,
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

    useCase = module.get<InitiatePasswordResetUseCase>(
      InitiatePasswordResetUseCase,
    );
    userRepository = module.get(USER_REPOSITORY_TOKEN);
    redisService = module.get(RedisService);
    emailService = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: InitiatePasswordResetCommand = {
      emailOrNickname: 'test@example.com',
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

    it('deve iniciar recuperação de senha com sucesso para usuário existente', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.setex.mockResolvedValue(undefined);
      emailService.sendEmail.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redisService.setex).toHaveBeenCalledWith(
        'password_reset_pin:1',
        900, // 15 minutos
        expect.any(String),
      );
      expect(emailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Recuperação de senha - Clã Boost',
        text: expect.stringContaining('Test User'),
        html: expect.stringContaining('Test User'),
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'Se o usuário existir, um PIN de recuperação foi enviado',
      );
    });

    it('deve retornar sucesso mesmo para usuário inexistente (segurança)', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(userRepository.findByEmailOrNickname).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redisService.setex).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toContain(
        'Se o usuário existir, um PIN de recuperação foi enviado',
      );
    });

    it('deve lançar erro quando email service falha', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.setex.mockResolvedValue(undefined);
      emailService.sendEmail.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve retornar sucesso para usuário sem email (segurança)', async () => {
      // Arrange
      const userWithoutEmail = new User(
        1,
        'testuser',
        'hashedpassword',
        UserRole.USER,
        undefined, // sem email
        'Test User',
      );
      userRepository.findByEmailOrNickname.mockResolvedValue(userWithoutEmail);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(redisService.setex).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('deve gerar PIN de 6 dígitos numéricos', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.setex.mockResolvedValue(undefined);
      emailService.sendEmail.mockResolvedValue(true);

      // Act
      await useCase.execute(validCommand);

      // Assert
      const redisCall = redisService.setex.mock.calls[0];
      const pin = redisCall[2];
      expect(pin).toMatch(/^\d{6}$/); // 6 dígitos numéricos
    });

    it('deve configurar expiração correta no Redis (15 minutos)', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.setex.mockResolvedValue(undefined);
      emailService.sendEmail.mockResolvedValue(true);

      // Act
      await useCase.execute(validCommand);

      // Assert
      expect(redisService.setex).toHaveBeenCalledWith(
        'password_reset_pin:1',
        900, // 15 minutos em segundos
        expect.any(String),
      );
    });

    it('deve usar chave Redis correta com ID do usuário', async () => {
      // Arrange
      const userWithDifferentId = new User(
        99,
        'testuser',
        'hashedpassword',
        UserRole.USER,
        'test@example.com',
        'Test User',
      );
      userRepository.findByEmailOrNickname.mockResolvedValue(
        userWithDifferentId,
      );
      redisService.setex.mockResolvedValue(undefined);
      emailService.sendEmail.mockResolvedValue(true);

      // Act
      await useCase.execute(validCommand);

      // Assert
      expect(redisService.setex).toHaveBeenCalledWith(
        'password_reset_pin:99',
        900,
        expect.any(String),
      );
    });

    it('deve incluir informações corretas no email HTML', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.setex.mockResolvedValue(undefined);
      emailService.sendEmail.mockResolvedValue(true);

      // Act
      await useCase.execute(validCommand);

      // Assert
      const emailCall = emailService.sendEmail.mock.calls[0][0];
      expect(emailCall.html).toContain('Test User');
      expect(emailCall.html).toContain('15 minutos');
      expect(emailCall.html).toMatch(/\d{6}/); // Contém o PIN
    });

    it('deve incluir informações corretas no email texto simples', async () => {
      // Arrange
      userRepository.findByEmailOrNickname.mockResolvedValue(mockUser);
      redisService.setex.mockResolvedValue(undefined);
      emailService.sendEmail.mockResolvedValue(true);

      // Act
      await useCase.execute(validCommand);

      // Assert
      const emailCall = emailService.sendEmail.mock.calls[0][0];
      expect(emailCall.text).toContain('Test User');
      expect(emailCall.text).toContain('15 minutos');
      expect(emailCall.text).toMatch(/\d{6}/); // Contém o PIN
    });
  });
});
