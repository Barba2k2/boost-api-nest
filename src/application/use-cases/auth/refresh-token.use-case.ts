import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  GenerateTokensUseCase,
  TokensResult,
} from './generate-tokens.use-case';

export interface RefreshTokenCommand {
  userId: number;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly generateTokensUseCase: GenerateTokensUseCase,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<TokensResult> {
    try {
      // Remover o prefixo 'Bearer ' do token se existir
      const refreshToken = command.refreshToken.replace('Bearer ', '');

      // Verificar se o token é válido
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.sub !== command.userId) {
        throw new UnauthorizedException('Token inválido');
      }

      // Buscar o usuário
      const user = await this.userRepository.findById(command.userId);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      // Gerar novos tokens
      const tokens = await this.generateTokensUseCase.execute({
        user,
        includeRefreshToken: true,
      });

      // Atualizar o refresh token do usuário
      await this.userRepository.updateTokens(command.userId, {
        refreshToken: tokens.refresh_token,
      });

      return {
        access_token: `Bearer ${tokens.access_token}`,
        refresh_token: `Bearer ${tokens.refresh_token}`,
      };
    } catch (error) {
      console.error('Erro ao verificar o token:', error);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
