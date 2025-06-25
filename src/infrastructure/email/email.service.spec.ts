import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { EmailOptions, EmailService } from './email.service';

// Mock do axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock do FormData
const mockFormData = {
  append: jest.fn(),
  getHeaders: jest
    .fn()
    .mockReturnValue({ 'content-type': 'multipart/form-data' }),
};

jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => mockFormData);
});

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
    mockFormData.append.mockClear();
    mockFormData.getHeaders.mockClear();
  });

  describe('constructor', () => {
    it('deve inicializar com API_KEY configurada', () => {
      // Arrange
      mockConfigService.get.mockReturnValue('test-api-key');

      // Act
      const testService = new EmailService(configService);

      // Assert
      expect(configService.get).toHaveBeenCalledWith('API_KEY');
      expect(testService).toBeDefined();
    });

    it('deve funcionar sem API_KEY (modo de desenvolvimento)', () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined);

      // Act
      const testService = new EmailService(configService);

      // Assert
      expect(testService).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-api-key');
      service = new EmailService(configService);
    });

    const validEmailOptions: EmailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test message',
      html: '<p>Test message</p>',
    };

    it('deve enviar email com sucesso', async () => {
      // Arrange
      const mockResponse = {
        data: { id: 'msg-12345' },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendEmail(validEmailOptions);

      // Assert
      expect(result).toBe(true);
      expect(mockFormData.append).toHaveBeenCalledWith(
        'from',
        'Boost Team <postmaster@boost-twitch.com>',
      );
      expect(mockFormData.append).toHaveBeenCalledWith(
        'to',
        'test@example.com',
      );
      expect(mockFormData.append).toHaveBeenCalledWith(
        'subject',
        'Test Subject',
      );
      expect(mockFormData.append).toHaveBeenCalledWith('text', 'Test message');
      expect(mockFormData.append).toHaveBeenCalledWith(
        'html',
        '<p>Test message</p>',
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/boost-twitch.com/messages',
        expect.any(Object),
        {
          auth: {
            username: 'api',
            password: 'test-api-key',
          },
          headers: { 'content-type': 'multipart/form-data' },
        },
      );
    });

    it('deve usar from personalizado quando fornecido', async () => {
      // Arrange
      const emailWithCustomFrom: EmailOptions = {
        ...validEmailOptions,
        from: 'custom@example.com',
      };
      const mockResponse = { data: { id: 'msg-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      await service.sendEmail(emailWithCustomFrom);

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith(
        'from',
        'custom@example.com',
      );
    });

    it('deve enviar email apenas com texto', async () => {
      // Arrange
      const textOnlyEmail: EmailOptions = {
        to: 'test@example.com',
        subject: 'Text Only',
        text: 'Plain text message',
      };
      const mockResponse = { data: { id: 'msg-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendEmail(textOnlyEmail);

      // Assert
      expect(result).toBe(true);
      expect(mockFormData.append).toHaveBeenCalledWith(
        'text',
        'Plain text message',
      );
      expect(mockFormData.append).not.toHaveBeenCalledWith(
        'html',
        expect.anything(),
      );
    });

    it('deve enviar email apenas com HTML', async () => {
      // Arrange
      const htmlOnlyEmail: EmailOptions = {
        to: 'test@example.com',
        subject: 'HTML Only',
        html: '<h1>HTML message</h1>',
      };
      const mockResponse = { data: { id: 'msg-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendEmail(htmlOnlyEmail);

      // Assert
      expect(result).toBe(true);
      expect(mockFormData.append).toHaveBeenCalledWith(
        'html',
        '<h1>HTML message</h1>',
      );
      expect(mockFormData.append).not.toHaveBeenCalledWith(
        'text',
        expect.anything(),
      );
    });

    it('deve retornar false quando API_KEY não estiver configurada', async () => {
      // Arrange
      mockConfigService.get.mockReturnValue('');
      const serviceWithoutKey = new EmailService(configService);

      // Act
      const result = await serviceWithoutKey.sendEmail(validEmailOptions);

      // Assert
      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('deve tratar erro de rede e retornar false', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedAxios.post.mockRejectedValue(networkError);

      // Act
      const result = await service.sendEmail(validEmailOptions);

      // Assert
      expect(result).toBe(false);
    });

    it('deve tratar erro de API do Mailgun e retornar false', async () => {
      // Arrange
      const apiError = {
        message: 'API Error',
        response: {
          data: { message: 'Invalid email address' },
        },
      };
      mockedAxios.post.mockRejectedValue(apiError);

      // Act
      const result = await service.sendEmail(validEmailOptions);

      // Assert
      expect(result).toBe(false);
    });

    it('deve tratar erro de autenticação', async () => {
      // Arrange
      const authError = {
        message: 'Forbidden',
        response: {
          status: 401,
          data: { message: 'Forbidden' },
        },
      };
      mockedAxios.post.mockRejectedValue(authError);

      // Act
      const result = await service.sendEmail(validEmailOptions);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-api-key');
      service = new EmailService(configService);
    });

    it('deve enviar email de boas-vindas com sucesso', async () => {
      // Arrange
      const mockResponse = { data: { id: 'welcome-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendWelcomeEmail(
        'newuser@example.com',
        'João',
      );

      // Assert
      expect(result).toBe(true);
      expect(mockFormData.append).toHaveBeenCalledWith(
        'to',
        'newuser@example.com',
      );
      expect(mockFormData.append).toHaveBeenCalledWith(
        'subject',
        'Bem vindo ao Clã Boost',
      );

      // Verificar se o nome do usuário está no texto
      const textCall = mockFormData.append.mock.calls.find(
        (call) => call[0] === 'text',
      );
      expect(textCall[1]).toContain('João');

      // Verificar se o nome do usuário está no HTML
      const htmlCall = mockFormData.append.mock.calls.find(
        (call) => call[0] === 'html',
      );
      expect(htmlCall[1]).toContain('João');
    });

    it('deve incluir elementos essenciais no email de boas-vindas', async () => {
      // Arrange
      const mockResponse = { data: { id: 'welcome-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      await service.sendWelcomeEmail('test@example.com', 'Maria');

      // Assert
      const htmlCall = mockFormData.append.mock.calls.find(
        (call) => call[0] === 'html',
      );
      const htmlContent = htmlCall[1];

      // Verificar elementos essenciais do email
      expect(htmlContent).toContain('Maria');
      expect(htmlContent).toContain('Boost Team');
      expect(htmlContent).toContain('comunidade');
      expect(htmlContent).toContain('https://bit.ly/boostTeamCommunity');
    });

    it('deve retornar false quando o envio falhar', async () => {
      // Arrange
      const error = new Error('SMTP Error');
      mockedAxios.post.mockRejectedValue(error);

      // Act
      const result = await service.sendWelcomeEmail(
        'test@example.com',
        'Carlos',
      );

      // Assert
      expect(result).toBe(false);
    });

    it('deve funcionar com nomes que contêm caracteres especiais', async () => {
      // Arrange
      const mockResponse = { data: { id: 'welcome-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendWelcomeEmail(
        'test@example.com',
        'José da Silva',
      );

      // Assert
      expect(result).toBe(true);

      const textCall = mockFormData.append.mock.calls.find(
        (call) => call[0] === 'text',
      );
      expect(textCall[1]).toContain('José da Silva');
    });
  });

  describe('configuração de domínio e email', () => {
    it('deve usar domínio boost-twitch.com', async () => {
      // Arrange
      mockConfigService.get.mockReturnValue('test-api-key');
      const mockResponse = { data: { id: 'msg-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.mailgun.net/v3/boost-twitch.com/messages',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('deve usar email padrão do remetente', async () => {
      // Arrange
      mockConfigService.get.mockReturnValue('test-api-key');
      const mockResponse = { data: { id: 'msg-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith(
        'from',
        'Boost Team <postmaster@boost-twitch.com>',
      );
    });
  });

  describe('integração com Mailgun', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test-api-key');
      service = new EmailService(configService);
    });

    it('deve usar autenticação básica correta', async () => {
      // Arrange
      const mockResponse = { data: { id: 'msg-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          auth: {
            username: 'api',
            password: 'test-api-key',
          },
        }),
      );
    });

    it('deve usar headers corretos do FormData', async () => {
      // Arrange
      const mockResponse = { data: { id: 'msg-12345' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      // Act
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      // Assert
      expect(mockFormData.getHeaders).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: { 'content-type': 'multipart/form-data' },
        }),
      );
    });
  });
});
