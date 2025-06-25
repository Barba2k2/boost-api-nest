import { EmailService } from '@infrastructure/email/email.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SendWelcomeEmailCommand,
  SendWelcomeEmailUseCase,
} from './send-welcome-email.use-case';

describe('SendWelcomeEmailUseCase', () => {
  let useCase: SendWelcomeEmailUseCase;
  let emailService: jest.Mocked<EmailService>;

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendWelcomeEmailUseCase,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    useCase = module.get<SendWelcomeEmailUseCase>(SendWelcomeEmailUseCase);
    emailService = module.get(EmailService);

    // Mock do Logger para evitar logs nos testes
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand: SendWelcomeEmailCommand = {
      email: 'test@example.com',
      userName: 'Test User',
    };

    it('deve enviar email de boas-vindas com sucesso', async () => {
      // Arrange
      emailService.sendWelcomeEmail.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Enviando email de boas-vindas para: test@example.com',
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Email de boas-vindas enviado com sucesso para: test@example.com',
      );
    });

    it('deve retornar false quando o email service falha', async () => {
      // Arrange
      emailService.sendWelcomeEmail.mockResolvedValue(false);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
      expect(result).toBe(false);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Enviando email de boas-vindas para: test@example.com',
      );
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Falha ao enviar email de boas-vindas para: test@example.com',
      );
    });

    it('deve retornar false e logar erro quando há uma exceção', async () => {
      // Arrange
      const error = new Error('Erro de conexão com o servidor de email');
      emailService.sendWelcomeEmail.mockRejectedValue(error);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
      expect(result).toBe(false);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Enviando email de boas-vindas para: test@example.com',
      );
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Erro ao enviar email de boas-vindas para test@example.com:',
        error,
      );
    });

    it('deve funcionar com diferentes emails e nomes de usuário', async () => {
      // Arrange
      const adminCommand: SendWelcomeEmailCommand = {
        email: 'admin@company.com',
        userName: 'Administrator',
      };
      emailService.sendWelcomeEmail.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(adminCommand);

      // Assert
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'admin@company.com',
        'Administrator',
      );
      expect(result).toBe(true);
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Enviando email de boas-vindas para: admin@company.com',
      );
    });

    it('deve lidar com emails com caracteres especiais', async () => {
      // Arrange
      const specialCommand: SendWelcomeEmailCommand = {
        email: 'user+test@example-domain.co.uk',
        userName: 'João da Silva',
      };
      emailService.sendWelcomeEmail.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(specialCommand);

      // Assert
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'user+test@example-domain.co.uk',
        'João da Silva',
      );
      expect(result).toBe(true);
    });

    it('deve lidar com nomes de usuário longos', async () => {
      // Arrange
      const longNameCommand: SendWelcomeEmailCommand = {
        email: 'user@example.com',
        userName: 'Nome Muito Longo do Usuário Com Vários Caracteres e Espaços',
      };
      emailService.sendWelcomeEmail.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(longNameCommand);

      // Assert
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Nome Muito Longo do Usuário Com Vários Caracteres e Espaços',
      );
      expect(result).toBe(true);
    });

    it('deve lidar com erro de timeout do serviço de email', async () => {
      // Arrange
      const timeoutError = new Error('Timeout: Request took too long');
      emailService.sendWelcomeEmail.mockRejectedValue(timeoutError);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result).toBe(false);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Erro ao enviar email de boas-vindas para test@example.com:',
        timeoutError,
      );
    });

    it('deve lidar com erro de autenticação do serviço de email', async () => {
      // Arrange
      const authError = new Error('Authentication failed');
      emailService.sendWelcomeEmail.mockRejectedValue(authError);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result).toBe(false);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Erro ao enviar email de boas-vindas para test@example.com:',
        authError,
      );
    });

    it('deve chamar o logger correto para cada etapa do processo', async () => {
      // Arrange
      emailService.sendWelcomeEmail.mockResolvedValue(true);
      // Limpar mocks para contar chamadas apenas deste teste
      jest.clearAllMocks();

      // Act
      await useCase.execute(validCommand);

      // Assert
      expect(Logger.prototype.log).toHaveBeenCalledTimes(2);
      expect(Logger.prototype.log).toHaveBeenNthCalledWith(
        1,
        'Enviando email de boas-vindas para: test@example.com',
      );
      expect(Logger.prototype.log).toHaveBeenNthCalledWith(
        2,
        'Email de boas-vindas enviado com sucesso para: test@example.com',
      );
    });

    it('deve executar e retornar false quando EmailService retorna valor falsy', async () => {
      // Arrange
      emailService.sendWelcomeEmail.mockResolvedValue(false);

      // Act
      const result = await useCase.execute(validCommand);

      // Assert
      expect(result).toBe(false);
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Falha ao enviar email de boas-vindas para: test@example.com',
      );
    });
  });
});
