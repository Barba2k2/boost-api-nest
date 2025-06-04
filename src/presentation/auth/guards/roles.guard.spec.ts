import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (
    user: any = null,
    roles: string[] | null = null,
  ): ExecutionContext => {
    const context = {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({ user })),
      })),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    // Mock do reflector
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);

    return context;
  };

  describe('canActivate', () => {
    it('deve retornar true quando não há roles requeridos', () => {
      // Arrange
      const context = createMockExecutionContext();

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('deve retornar true quando usuário tem role requerido', () => {
      // Arrange
      const user = { role: 'admin' };
      const requiredRoles = ['admin'];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar true quando usuário tem um dos roles requeridos', () => {
      // Arrange
      const user = { role: 'user' };
      const requiredRoles = ['admin', 'user'];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false quando usuário não tem role requerido', () => {
      // Arrange
      const user = { role: 'user' };
      const requiredRoles = ['admin'];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false quando usuário não está presente', () => {
      // Arrange
      const requiredRoles = ['admin'];
      const context = createMockExecutionContext(null, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false quando usuário não tem propriedade role', () => {
      // Arrange
      const user = { id: 1, nickname: 'test' }; // sem role
      const requiredRoles = ['admin'];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false quando role do usuário é undefined', () => {
      // Arrange
      const user = { role: undefined };
      const requiredRoles = ['admin'];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false quando role do usuário é null', () => {
      // Arrange
      const user = { role: null };
      const requiredRoles = ['admin'];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('deve funcionar com múltiplos roles requeridos', () => {
      // Arrange
      const user = { role: 'assistant' };
      const requiredRoles = ['admin', 'user', 'assistant'];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false com array vazio de roles requeridos', () => {
      // Arrange
      const user = { role: 'admin' };
      const requiredRoles: string[] = [];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('deve usar reflector corretamente para obter metadata', () => {
      // Arrange
      const user = { role: 'admin' };
      const requiredRoles = ['admin'];
      const context = createMockExecutionContext(user, requiredRoles);

      // Act
      guard.canActivate(context);

      // Assert
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
