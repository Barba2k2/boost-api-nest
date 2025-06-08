import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MAILGUN_API_KEY: 'test-key',
                MAILGUN_DOMAIN: 'test-domain.com',
                MAILGUN_API_URL: 'https://api.mailgun.net',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve inicializar sem erro do FormDataConstructor usando FormData nativo', () => {
    expect(() => {
      new EmailService(configService);
    }).not.toThrow();
  });

  it('deve configurar o domínio corretamente', () => {
    const spy = jest.spyOn(configService, 'get');
    new EmailService(configService);

    expect(spy).toHaveBeenCalledWith('MAILGUN_API_KEY');
    expect(spy).toHaveBeenCalledWith('MAILGUN_DOMAIN');
  });

  it('deve lidar com API key ausente', () => {
    const configServiceWithoutKey = {
      get: jest.fn((key: string) => {
        const config = {
          MAILGUN_DOMAIN: 'test-domain.com',
        };
        return config[key];
      }),
    } as any;

    expect(() => {
      new EmailService(configServiceWithoutKey);
    }).not.toThrow();
  });

  it('deve usar FormData nativo do Node.js', () => {
    // Verificar se FormData é o global/nativo
    expect(typeof FormData).toBe('function');
    expect(FormData.name).toBe('FormData');
  });
});
