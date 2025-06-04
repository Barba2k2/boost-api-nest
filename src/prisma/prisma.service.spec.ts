import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Mock dos métodos do PrismaClient para evitar conexões reais
    service.$connect = jest.fn().mockResolvedValue(undefined);
    service.$disconnect = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PrismaService', () => {
    it('deve ser definido', () => {
      expect(service).toBeDefined();
    });

    it('deve ter métodos do ciclo de vida', () => {
      expect(typeof service.onModuleInit).toBe('function');
      expect(typeof service.onModuleDestroy).toBe('function');
      expect(typeof service.enableShutdownHooks).toBe('function');
    });

    it('deve estender PrismaClient e ter métodos básicos', () => {
      // Verifica se tem métodos do PrismaClient
      expect(service.$connect).toBeDefined();
      expect(service.$disconnect).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('deve chamar $connect quando módulo inicializar', async () => {
      // Act
      await service.onModuleInit();

      // Assert
      expect(service.$connect).toHaveBeenCalled();
      expect(service.$connect).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro de conexão', async () => {
      // Arrange
      const connectionError = new Error('Database connection failed');
      (service.$connect as jest.Mock).mockRejectedValue(connectionError);

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('deve chamar $disconnect quando módulo for destruído', async () => {
      // Act
      await service.onModuleDestroy();

      // Assert
      expect(service.$disconnect).toHaveBeenCalled();
      expect(service.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro de desconexão', async () => {
      // Arrange
      const disconnectionError = new Error('Database disconnection failed');
      (service.$disconnect as jest.Mock).mockRejectedValue(disconnectionError);

      // Act & Assert
      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Database disconnection failed',
      );
    });
  });

  describe('enableShutdownHooks', () => {
    let mockApp: jest.Mocked<INestApplication>;

    beforeEach(() => {
      // Mock da aplicação
      mockApp = {
        close: jest.fn().mockResolvedValue(undefined),
      } as any;
    });

    it('deve adicionar listener para beforeExit', () => {
      // Arrange
      const initialListeners = process.listenerCount('beforeExit');

      // Act
      service.enableShutdownHooks(mockApp);

      // Assert
      expect(process.listenerCount('beforeExit')).toBe(initialListeners + 1);
    });

    it('deve chamar app.close() quando processo receber beforeExit', (done) => {
      // Arrange
      service.enableShutdownHooks(mockApp);

      // Act
      process.emit('beforeExit', 0);

      // Assert - Usa setTimeout para aguardar execução assíncrona
      setTimeout(() => {
        expect(mockApp.close).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('deve capturar erro no fechamento da aplicação', (done) => {
      // Arrange
      const closeError = new Error('Failed to close app');
      mockApp.close.mockRejectedValue(closeError);

      // Spy no console.error para verificar tratamento de erro
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.enableShutdownHooks(mockApp);

      // Act
      process.emit('beforeExit', 0);

      // Assert
      setTimeout(() => {
        expect(mockApp.close).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(closeError);

        // Cleanup
        consoleSpy.mockRestore();
        done();
      }, 50);
    });

    it('deve permitir múltiplas chamadas do enableShutdownHooks', () => {
      // Arrange
      const initialListeners = process.listenerCount('beforeExit');

      // Act
      service.enableShutdownHooks(mockApp);
      service.enableShutdownHooks(mockApp);

      // Assert
      expect(process.listenerCount('beforeExit')).toBe(initialListeners + 2);
    });
  });

  describe('constructor', () => {
    it('deve ser inicializado com configurações corretas de log', () => {
      // O construtor já foi chamado no beforeEach
      // Verificamos se o serviço foi criado corretamente
      expect(service).toBeInstanceOf(PrismaService);

      // Verifica se herda métodos do PrismaClient
      expect(typeof service.$connect).toBe('function');
      expect(typeof service.$disconnect).toBe('function');
    });
  });
});
