import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import { User } from '@domain/entities/user.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface GenerateTokensCommand {
  user: User;
  includeRefreshToken?: boolean;
}

export interface TokensResult {
  access_token: string;
  refresh_token?: string;
}

@Injectable()
export class GenerateTokensUseCase {
  private readonly logger = new Logger(GenerateTokensUseCase.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(command: GenerateTokensCommand): Promise<TokensResult> {
    this.logger.log(
      `[TOKEN_GENERATION] Iniciando geração de tokens para usuário ID: ${command.user.id}, Nick: ${command.user.nickname}`,
    );

    // Buscar dados do streamer se existir
    this.logger.log(
      `[STREAMER_LOOKUP] Buscando dados do streamer para usuário ID: ${command.user.id}`,
    );
    const streamer = await this.streamerRepository.findByUserId(
      command.user.id,
    );
    const streamerId = streamer?.id || null;

    if (streamer) {
      this.logger.log(
        `[STREAMER_FOUND] Streamer encontrado - ID: ${streamer.id}, Pontos: ${streamer.points}, Online: ${streamer.isOnline}`,
      );
    } else {
      this.logger.log(
        `[STREAMER_NOT_FOUND] Nenhum streamer associado ao usuário ID: ${command.user.id}`,
      );
    }

    const payload = {
      sub: command.user.id,
      nickname: command.user.nickname,
      role: command.user.role,
      streamerId: streamerId,
    };

    this.logger.log(
      `[ACCESS_TOKEN] Gerando access token para payload: ${JSON.stringify({ ...payload, sub: '[HIDDEN]' })}`,
    );
    const accessToken = this.jwtService.sign(payload);
    this.logger.log(
      `[ACCESS_TOKEN_SUCCESS] Access token gerado com sucesso para usuário ID: ${command.user.id}`,
    );

    const result: TokensResult = {
      access_token: accessToken,
    };

    if (command.includeRefreshToken) {
      this.logger.log(
        `[REFRESH_TOKEN] Gerando refresh token para usuário ID: ${command.user.id}`,
      );
      const refreshToken = this.jwtService.sign(
        { sub: command.user.id, role: command.user.role },
        { expiresIn: '20d' },
      );
      result.refresh_token = refreshToken;
      this.logger.log(
        `[REFRESH_TOKEN_SUCCESS] Refresh token gerado com sucesso para usuário ID: ${command.user.id}`,
      );
    }

    this.logger.log(
      `[TOKEN_GENERATION_SUCCESS] Geração de tokens concluída com sucesso para usuário ID: ${command.user.id}, includeRefreshToken: ${command.includeRefreshToken}`,
    );

    return result;
  }
}
