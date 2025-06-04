import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    // Mock do process.env.JWT_SECRET
    process.env.JWT_SECRET = 'test-secret-key';
    strategy = new JwtStrategy();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('validate', () => {
    it('deve retornar objeto de usuário com payload válido', async () => {
      // Arrange
      const payload = {
        sub: 123,
        nickname: 'testuser',
        role: 'user',
        streamerId: 456,
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: 123,
        nickname: 'testuser',
        role: 'user',
        streamerId: 456,
      });
    });

    it('deve mapear corretamente sub para id', async () => {
      // Arrange
      const payload = {
        sub: 789,
        nickname: 'admin',
        role: 'admin',
        streamerId: null,
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result.id).toBe(789);
      expect(result.streamerId).toBeNull();
    });

    it('deve funcionar com payload sem streamerId', async () => {
      // Arrange
      const payload = {
        sub: 111,
        nickname: 'assistant',
        role: 'assistant',
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: 111,
        nickname: 'assistant',
        role: 'assistant',
        streamerId: undefined,
      });
    });

    it('deve manter valores undefined no payload', async () => {
      // Arrange
      const payload = {
        sub: 222,
        nickname: undefined,
        role: undefined,
        streamerId: undefined,
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: 222,
        nickname: undefined,
        role: undefined,
        streamerId: undefined,
      });
    });

    it('deve funcionar com payload com propriedades extras', async () => {
      // Arrange
      const payload = {
        sub: 333,
        nickname: 'streamer',
        role: 'user',
        streamerId: 777,
        iat: 1640995200,
        exp: 1641081600,
        extraProperty: 'should-be-ignored',
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: 333,
        nickname: 'streamer',
        role: 'user',
        streamerId: 777,
      });
      expect(result).not.toHaveProperty('iat');
      expect(result).not.toHaveProperty('exp');
      expect(result).not.toHaveProperty('extraProperty');
    });

    it('deve funcionar com números como strings', async () => {
      // Arrange
      const payload = {
        sub: '444',
        nickname: 'user',
        role: 'user',
        streamerId: '888',
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: '444',
        nickname: 'user',
        role: 'user',
        streamerId: '888',
      });
    });

    it('deve lidar com payload vazio', async () => {
      // Arrange
      const payload = {};

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        id: undefined,
        nickname: undefined,
        role: undefined,
        streamerId: undefined,
      });
    });

    it('deve lidar com payload null', async () => {
      // Arrange
      const payload = null;

      // Act & Assert
      // Payload null causará erro ao tentar acessar payload.sub
      await expect(strategy.validate(payload)).rejects.toThrow();
    });

    it('deve funcionar com diferentes tipos de roles', async () => {
      // Arrange - Teste com role admin
      const adminPayload = {
        sub: 1,
        nickname: 'admin',
        role: 'admin',
        streamerId: null,
      };

      // Act
      const adminResult = await strategy.validate(adminPayload);

      // Assert
      expect(adminResult.role).toBe('admin');

      // Arrange - Teste com role user
      const userPayload = {
        sub: 2,
        nickname: 'user',
        role: 'user',
        streamerId: 123,
      };

      // Act
      const userResult = await strategy.validate(userPayload);

      // Assert
      expect(userResult.role).toBe('user');

      // Arrange - Teste com role assistant
      const assistantPayload = {
        sub: 3,
        nickname: 'assistant',
        role: 'assistant',
        streamerId: null,
      };

      // Act
      const assistantResult = await strategy.validate(assistantPayload);

      // Assert
      expect(assistantResult.role).toBe('assistant');
    });
  });
});
