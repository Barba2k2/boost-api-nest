import { User, UserRole } from '@domain/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { SessionData, SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    setex: jest.fn(),
    has: jest.fn(),
    incr: jest.fn(),
    mset: jest.fn(),
    mget: jest.fn(),
    reset: jest.fn(),
  };

  const mockUser: User = new User(
    1,
    'testuser',
    'hashedpassword',
    UserRole.USER,
    'test@example.com',
    'Test User',
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    redisService = module.get(RedisService);

    // Mock Date.now para testes determinísticos (exceto onde há mock específico)
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Note: não vamos resetar todos os mocks para permitir mocks específicos em testes individuais
  });

  describe('createSession', () => {
    it('deve criar uma nova sessão com sucesso', async () => {
      // Arrange
      const metadata = { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' };
      redisService.setex.mockResolvedValue();
      redisService.get.mockResolvedValue([]); // Lista vazia de sessões do usuário

      // Act
      const sessionId = await service.createSession(mockUser, metadata);

      // Assert
      expect(sessionId).toBe('sess_1640995200000_4fzzzxjyl');

      const expectedSessionData: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995200000,
        lastActivity: 1640995200000,
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      expect(redisService.setex).toHaveBeenCalledWith(
        'session:sess_1640995200000_4fzzzxjyl',
        86400, // 24 * 60 * 60
        expectedSessionData,
      );

      // Verificar se adicionou à lista de sessões do usuário
      expect(redisService.get).toHaveBeenCalledWith('user_sessions:1');
    });

    it('deve criar sessão sem metadata opcional', async () => {
      // Arrange
      redisService.setex.mockResolvedValue();
      redisService.get.mockResolvedValue([]);

      // Act
      const sessionId = await service.createSession(mockUser);

      // Assert
      const expectedSessionData: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995200000,
        lastActivity: 1640995200000,
        ip: undefined,
        userAgent: undefined,
      };

      expect(redisService.setex).toHaveBeenCalledWith(
        expect.stringContaining('session:sess_'),
        86400,
        expectedSessionData,
      );
    });

    it('deve adicionar sessão à lista existente do usuário', async () => {
      // Arrange
      const existingSessions = ['sess_old_session'];
      redisService.setex.mockResolvedValue();
      redisService.get.mockResolvedValue(existingSessions);

      // Act
      await service.createSession(mockUser);

      // Assert
      expect(redisService.setex).toHaveBeenCalledWith(
        'user_sessions:1',
        86400,
        ['sess_old_session', 'sess_1640995200000_4fzzzxjyl'],
      );
    });
  });

  describe('getSession', () => {
    it('deve retornar dados da sessão e atualizar última atividade', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const sessionData: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get.mockResolvedValue(sessionData);
      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.getSession(sessionId);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith('session:test-session-id');
      expect(result).toEqual({
        ...sessionData,
        lastActivity: 1640995200000, // atualizado para Date.now()
      });

      expect(redisService.setex).toHaveBeenCalledWith(
        'session:test-session-id',
        86400,
        {
          ...sessionData,
          lastActivity: 1640995200000,
        },
      );
    });

    it('deve retornar null quando sessão não existe', async () => {
      // Arrange
      const sessionId = 'nonexistent-session';
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.getSession(sessionId);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(
        'session:nonexistent-session',
      );
      expect(result).toBeNull();
      expect(redisService.setex).not.toHaveBeenCalled();
    });

    it('deve retornar null quando sessão é undefined', async () => {
      // Arrange
      const sessionId = 'undefined-session';
      redisService.get.mockResolvedValue(undefined);

      // Act
      const result = await service.getSession(sessionId);

      // Assert
      expect(result).toBeNull();
      expect(redisService.setex).not.toHaveBeenCalled();
    });
  });

  describe('removeSession', () => {
    it('deve remover sessão e atualizar lista do usuário', async () => {
      // Arrange
      const sessionId = 'session-to-remove';
      const sessionData: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get
        .mockResolvedValueOnce(sessionData) // primeira chamada em getSession
        .mockResolvedValueOnce(['session-to-remove', 'other-session']); // lista de sessões do usuário

      redisService.setex.mockResolvedValue(); // para atualizar lastActivity
      redisService.del.mockResolvedValue();

      // Act
      await service.removeSession(sessionId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(
        'session:session-to-remove',
      );
      expect(redisService.setex).toHaveBeenCalledWith(
        'user_sessions:1',
        86400,
        ['other-session'],
      );
    });

    it('deve remover sessão mesmo quando não encontra dados da sessão', async () => {
      // Arrange
      const sessionId = 'nonexistent-session';
      redisService.get.mockResolvedValue(null);
      redisService.del.mockResolvedValue();

      // Act
      await service.removeSession(sessionId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(
        'session:nonexistent-session',
      );
    });

    it('deve deletar lista do usuário quando remove última sessão', async () => {
      // Arrange
      const sessionId = 'last-session';
      const sessionData: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get
        .mockResolvedValueOnce(sessionData)
        .mockResolvedValueOnce(['last-session']); // única sessão

      redisService.setex.mockResolvedValue();
      redisService.del.mockResolvedValue();

      // Act
      await service.removeSession(sessionId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('user_sessions:1');
    });
  });

  describe('removeAllUserSessions', () => {
    it('deve remover todas as sessões de um usuário', async () => {
      // Arrange
      const userId = 1;
      const sessions = ['session1', 'session2', 'session3'];
      redisService.get.mockResolvedValue(sessions);
      redisService.del.mockResolvedValue();

      // Act
      await service.removeAllUserSessions(userId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('session:session1');
      expect(redisService.del).toHaveBeenCalledWith('session:session2');
      expect(redisService.del).toHaveBeenCalledWith('session:session3');
      expect(redisService.del).toHaveBeenCalledWith('user_sessions:1');
      expect(redisService.del).toHaveBeenCalledTimes(4);
    });

    it('deve funcionar quando usuário não tem sessões', async () => {
      // Arrange
      const userId = 1;
      redisService.get.mockResolvedValue([]);
      redisService.del.mockResolvedValue();

      // Act
      await service.removeAllUserSessions(userId);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('user_sessions:1');
      expect(redisService.del).toHaveBeenCalledTimes(1);
    });
  });

  describe('getActiveUserSessions', () => {
    it('deve retornar lista de sessões ativas do usuário', async () => {
      // Arrange
      const userId = 1;
      const sessionIds = ['session1', 'session2'];
      const sessionData1: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995100000,
        lastActivity: 1640995150000,
      };
      const sessionData2: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995120000,
        lastActivity: 1640995180000,
      };

      redisService.get
        .mockResolvedValueOnce(sessionIds) // getUserSessions
        .mockResolvedValueOnce(sessionData1) // getSession para session1
        .mockResolvedValueOnce(sessionData2); // getSession para session2

      redisService.setex.mockResolvedValue(); // para atualizar lastActivity

      // Act
      const result = await service.getActiveUserSessions(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        sessionId: 'session1',
        data: { ...sessionData1, lastActivity: 1640995200000 },
        expiresAt: 1640995200000 + 86400 * 1000,
      });
      expect(result[1]).toEqual({
        sessionId: 'session2',
        data: { ...sessionData2, lastActivity: 1640995200000 },
        expiresAt: 1640995200000 + 86400 * 1000,
      });
    });

    it('deve filtrar sessões inválidas', async () => {
      // Arrange
      const userId = 1;
      const sessionIds = ['session1', 'invalid-session'];
      const sessionData1: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get
        .mockResolvedValueOnce(sessionIds)
        .mockResolvedValueOnce(sessionData1) // session1 válida
        .mockResolvedValueOnce(null); // invalid-session retorna null

      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.getActiveUserSessions(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('session1');
    });

    it('deve retornar array vazio quando usuário não tem sessões', async () => {
      // Arrange
      const userId = 1;
      redisService.get.mockResolvedValue([]);

      // Act
      const result = await service.getActiveUserSessions(userId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('isValidSession', () => {
    it('deve retornar true para sessão válida', async () => {
      // Arrange
      const sessionId = 'valid-session';
      const sessionData: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get.mockResolvedValue(sessionData);
      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.isValidSession(sessionId);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false para sessão inválida', async () => {
      // Arrange
      const sessionId = 'invalid-session';
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.isValidSession(sessionId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('extendSession', () => {
    it('deve estender sessão válida', async () => {
      // Arrange
      const sessionId = 'valid-session';
      const sessionData: SessionData = {
        userId: 1,
        nickname: 'testuser',
        role: UserRole.USER,
        loginTime: 1640995100000,
        lastActivity: 1640995150000,
      };

      redisService.get.mockResolvedValue(sessionData);
      redisService.setex.mockResolvedValue();

      // Act
      const result = await service.extendSession(sessionId);

      // Assert
      expect(result).toBe(true);
      expect(redisService.setex).toHaveBeenCalledWith(
        'session:valid-session',
        86400,
        {
          ...sessionData,
          lastActivity: 1640995200000,
        },
      );
    });

    it('deve retornar false para sessão inválida', async () => {
      // Arrange
      const sessionId = 'invalid-session';
      redisService.get.mockResolvedValue(null);

      // Act
      const result = await service.extendSession(sessionId);

      // Assert
      expect(result).toBe(false);
      expect(redisService.setex).toHaveBeenCalledTimes(0);
    });
  });

  describe('getActiveSessionsCount', () => {
    it('deve retornar 0 (implementação placeholder)', async () => {
      // Act
      const result = await service.getActiveSessionsCount();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('private methods (via integration)', () => {
    describe('generateSessionId', () => {
      it('deve gerar ID único para cada sessão', async () => {
        // Arrange
        // Usar timestamp igual mas Math.random diferentes para garantir IDs únicos
        jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // sempre o mesmo timestamp

        jest
          .spyOn(Math, 'random')
          .mockReturnValueOnce(0.123456789) // primeiro ID
          .mockReturnValueOnce(0.987654321); // segundo ID

        redisService.setex.mockResolvedValue();
        redisService.get.mockResolvedValue([]);

        // Act
        const sessionId1 = await service.createSession(mockUser);
        const sessionId2 = await service.createSession(mockUser);

        // Assert
        expect(sessionId1).toBe('sess_1640995200000_4fzzzxjyl');
        expect(sessionId2).toBe('sess_1640995200000_zk00000yt');
        expect(sessionId1).not.toBe(sessionId2);

        // Cleanup para esse teste específico
        jest.restoreAllMocks();
      });
    });
  });
});
