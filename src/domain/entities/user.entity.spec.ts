import { User, UserRole } from './user.entity';

describe('User Entity', () => {
  describe('constructor', () => {
    it('deve criar um usuário com todos os parâmetros', () => {
      // Act
      const user = new User(1, 'testuser', 'password123', UserRole.USER);

      // Assert
      expect(user.id).toBe(1);
      expect(user.nickname).toBe('testuser');
      expect(user.password).toBe('password123');
      expect(user.role).toBe(UserRole.USER);
    });
  });

  describe('isAdmin', () => {
    it('deve retornar true para usuário ADMIN', () => {
      // Arrange
      const adminUser = new User(1, 'admin', 'password', UserRole.ADMIN);

      // Act & Assert
      expect(adminUser.isAdmin()).toBe(true);
    });

    it('deve retornar false para usuário USER', () => {
      // Arrange
      const regularUser = new User(1, 'user', 'password', UserRole.USER);

      // Act & Assert
      expect(regularUser.isAdmin()).toBe(false);
    });

    it('deve retornar false para usuário ASSISTANT', () => {
      // Arrange
      const assistantUser = new User(
        1,
        'assistant',
        'password',
        UserRole.ASSISTANT,
      );

      // Act & Assert
      expect(assistantUser.isAdmin()).toBe(false);
    });
  });

  describe('isUser', () => {
    it('deve retornar true para usuário USER', () => {
      // Arrange
      const regularUser = new User(1, 'user', 'password', UserRole.USER);

      // Act & Assert
      expect(regularUser.isUser()).toBe(true);
    });

    it('deve retornar false para usuário ADMIN', () => {
      // Arrange
      const adminUser = new User(1, 'admin', 'password', UserRole.ADMIN);

      // Act & Assert
      expect(adminUser.isUser()).toBe(false);
    });

    it('deve retornar false para usuário ASSISTANT', () => {
      // Arrange
      const assistantUser = new User(
        1,
        'assistant',
        'password',
        UserRole.ASSISTANT,
      );

      // Act & Assert
      expect(assistantUser.isUser()).toBe(false);
    });
  });

  describe('isAssistant', () => {
    it('deve retornar true para usuário ASSISTANT', () => {
      // Arrange
      const assistantUser = new User(
        1,
        'assistant',
        'password',
        UserRole.ASSISTANT,
      );

      // Act & Assert
      expect(assistantUser.isAssistant()).toBe(true);
    });

    it('deve retornar false para usuário USER', () => {
      // Arrange
      const regularUser = new User(1, 'user', 'password', UserRole.USER);

      // Act & Assert
      expect(regularUser.isAssistant()).toBe(false);
    });

    it('deve retornar false para usuário ADMIN', () => {
      // Arrange
      const adminUser = new User(1, 'admin', 'password', UserRole.ADMIN);

      // Act & Assert
      expect(adminUser.isAssistant()).toBe(false);
    });
  });

  describe('canCreateStreamer', () => {
    it('deve retornar true para usuário ADMIN', () => {
      // Arrange
      const adminUser = new User(1, 'admin', 'password', UserRole.ADMIN);

      // Act & Assert
      expect(adminUser.canCreateStreamer()).toBe(true);
    });

    it('deve retornar true para usuário USER', () => {
      // Arrange
      const regularUser = new User(1, 'user', 'password', UserRole.USER);

      // Act & Assert
      expect(regularUser.canCreateStreamer()).toBe(true);
    });

    it('deve retornar false para usuário ASSISTANT', () => {
      // Arrange
      const assistantUser = new User(
        1,
        'assistant',
        'password',
        UserRole.ASSISTANT,
      );

      // Act & Assert
      expect(assistantUser.canCreateStreamer()).toBe(false);
    });
  });

  describe('UserRole enum', () => {
    it('deve ter valores corretos', () => {
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.USER).toBe('user');
      expect(UserRole.ASSISTANT).toBe('assistant');
    });
  });
});
