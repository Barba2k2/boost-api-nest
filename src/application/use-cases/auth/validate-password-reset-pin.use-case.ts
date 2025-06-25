import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { RedisService } from '@infrastructure/cache/redis.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

export interface ValidatePasswordResetPinCommand {
  emailOrNickname: string;
  pin: string;
}

export interface ValidatePasswordResetPinResult {
  valid: boolean;
  token?: string;
  message: string;
}

@Injectable()
export class ValidatePasswordResetPinUseCase {
  private readonly logger = new Logger(ValidatePasswordResetPinUseCase.name);
  private readonly RESET_TOKEN_EXPIRATION = 30 * 60; // 30 minutos para completar o reset

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(
    command: ValidatePasswordResetPinCommand,
  ): Promise<ValidatePasswordResetPinResult> {
    try {
      // Buscar usuário
      const user = await this.userRepository.findByEmailOrNickname(
        command.emailOrNickname,
      );

      if (!user) {
        throw new BadRequestException('PIN inválido ou expirado');
      }

      // Verificar PIN no Redis
      const pinKey = `password_reset_pin:${user.id}`;
      const storedPin = await this.redisService.get<string>(pinKey);

      if (!storedPin || storedPin !== command.pin) {
        this.logger.warn(
          `Tentativa de validação com PIN inválido para usuário ${user.id}`,
        );
        throw new BadRequestException('PIN inválido ou expirado');
      }

      // PIN válido - gerar token de reset de senha
      const resetToken = this.generateResetToken();
      const resetTokenKey = `password_reset_token:${user.id}`;

      // Armazenar token de reset no Redis
      await this.redisService.setex(
        resetTokenKey,
        this.RESET_TOKEN_EXPIRATION,
        resetToken,
      );

      // Remover PIN (não pode ser reutilizado)
      await this.redisService.del(pinKey);

      this.logger.log(
        `PIN validado com sucesso para usuário ${user.id}, token de reset gerado`,
      );

      return {
        valid: true,
        token: resetToken,
        message:
          'PIN validado com sucesso. Você pode agora definir uma nova senha.',
      };
    } catch (error) {
      this.logger.error(`Erro ao validar PIN: ${error.message}`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Erro interno. Tente novamente mais tarde.',
      );
    }
  }

  private generateResetToken(): string {
    // Gerar um token seguro de 32 caracteres
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
