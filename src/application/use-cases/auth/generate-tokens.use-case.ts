import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import { User } from '@domain/entities/user.entity';
import { Inject, Injectable } from '@nestjs/common';
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
  constructor(
    private readonly jwtService: JwtService,
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(command: GenerateTokensCommand): Promise<TokensResult> {
    // Buscar dados do streamer se existir
    const streamer = await this.streamerRepository.findByUserId(
      command.user.id,
    );
    const streamerId = streamer?.id || null;

    const payload = {
      sub: command.user.id,
      nickname: command.user.nickname,
      role: command.user.role,
      streamerId: streamerId,
    };

    const accessToken = this.jwtService.sign(payload);

    const result: TokensResult = {
      access_token: accessToken,
    };

    if (command.includeRefreshToken) {
      const refreshToken = this.jwtService.sign(
        { sub: command.user.id, role: command.user.role },
        { expiresIn: '20d' },
      );
      result.refresh_token = refreshToken;
    }

    return result;
  }
}
