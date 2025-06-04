import { User } from '@domain/entities/user.entity';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RateLimitService } from '../../../infrastructure/cache/rate-limit.service';
import { SessionService } from '../../../infrastructure/cache/session.service';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

export interface AuthenticateCommand {
  nickname: string;
  password: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
  };
}

export interface AuthenticateResult {
  user: User;
  sessionId: string;
}

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly sessionService: SessionService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(command: AuthenticateCommand): Promise<AuthenticateResult> {
    const identifier = command.metadata?.ip || command.nickname;

    // Verificar rate limiting para login
    const rateLimitResult =
      await this.rateLimitService.checkLoginRateLimit(identifier);
    if (!rateLimitResult.allowed) {
      throw new UnauthorizedException(
        `Muitas tentativas de login. Tente novamente em ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)} minutos.`,
      );
    }

    // Verificar se está temporariamente bloqueado
    const isBlocked =
      await this.rateLimitService.isTemporarilyBlocked(identifier);
    if (isBlocked) {
      throw new UnauthorizedException(
        'Conta temporariamente bloqueada devido a muitas tentativas falhadas.',
      );
    }

    const user = await this.userRepository.findByNickname(command.nickname);

    if (!user) {
      // Incrementar tentativas falhadas
      await this.rateLimitService.incrementFailedAttempts(identifier);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Login bem-sucedido - limpar tentativas falhadas
    await this.rateLimitService.clearFailedAttempts(identifier);

    // Criar sessão
    const sessionId = await this.sessionService.createSession(
      user,
      command.metadata,
    );

    return {
      user,
      sessionId,
    };
  }
}
