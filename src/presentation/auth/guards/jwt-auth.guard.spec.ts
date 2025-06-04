import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  describe('JwtAuthGuard', () => {
    it('deve ser definido', () => {
      expect(guard).toBeDefined();
    });

    it('deve ser uma instância da classe JwtAuthGuard', () => {
      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });

    it('deve ter a estrutura de classe correta', () => {
      expect(guard.constructor.name).toBe('JwtAuthGuard');
    });

    it('deve herdar métodos do AuthGuard', () => {
      // Verifica se tem os métodos típicos de um guard
      expect(typeof guard.canActivate).toBe('function');
    });
  });
});
