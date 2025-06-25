import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { RedisService } from '@infrastructure/cache/redis.service';
import { EmailService } from '@infrastructure/email/email.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';

export interface InitiatePasswordResetCommand {
  emailOrNickname: string;
}

export interface InitiatePasswordResetResult {
  message: string;
  success: boolean;
}

@Injectable()
export class InitiatePasswordResetUseCase {
  private readonly logger = new Logger(InitiatePasswordResetUseCase.name);
  private readonly PIN_EXPIRATION_TIME = 15 * 60; // 15 minutos em segundos
  private readonly PIN_LENGTH = 6;

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    command: InitiatePasswordResetCommand,
  ): Promise<InitiatePasswordResetResult> {
    try {
      // Buscar usuário por email ou nickname
      const user = await this.userRepository.findByEmailOrNickname(
        command.emailOrNickname,
      );

      if (!user || !user.email) {
        // Por segurança, sempre retornamos a mesma mensagem
        // mesmo quando o usuário não existe
        return {
          message:
            'Se o usuário existir, um PIN de recuperação foi enviado para o email cadastrado.',
          success: true,
        };
      }

      // Gerar PIN de 6 dígitos
      const pin = this.generateSecurePin();

      // Armazenar PIN no Redis com expiração
      const pinKey = `password_reset_pin:${user.id}`;
      await this.redisService.setex(pinKey, this.PIN_EXPIRATION_TIME, pin);

      // Enviar email com PIN
      const emailSent = await this.sendPasswordResetEmail(
        user.email,
        user.fullName || user.nickname,
        pin,
      );

      if (!emailSent) {
        this.logger.error(
          `Falha ao enviar email de recuperação para usuário ${user.id}`,
        );
        throw new BadRequestException(
          'Erro interno. Tente novamente mais tarde.',
        );
      }

      this.logger.log(
        `PIN de recuperação gerado e enviado para usuário ${user.id}`,
      );

      return {
        message:
          'Se o usuário existir, um PIN de recuperação foi enviado para o email cadastrado.',
        success: true,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao iniciar recuperação de senha: ${error.message}`,
        error,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Erro interno. Tente novamente mais tarde.',
      );
    }
  }

  private generateSecurePin(): string {
    // Gerar um PIN seguro de 6 dígitos
    let pin = '';
    for (let i = 0; i < this.PIN_LENGTH; i++) {
      pin += crypto.randomInt(0, 10).toString();
    }
    return pin;
  }

  private async sendPasswordResetEmail(
    email: string,
    userName: string,
    pin: string,
  ): Promise<boolean> {
    const subject = 'Recuperação de senha - Clã Boost';
    const text = `Olá ${userName},\n\nSeu PIN de recuperação de senha é: ${pin}\n\nEste PIN é válido por 15 minutos.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #e63946;">Recuperação de senha</h2>
        <p>Olá, <strong>${userName}</strong>!</p>
        
        <p>Você solicitou a recuperação da sua senha na <strong>Boost Team</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="color: #1d3557; margin: 0;">Seu PIN de recuperação:</h3>
          <div style="font-size: 32px; font-weight: bold; color: #e63946; letter-spacing: 8px; margin: 15px 0;">
            ${pin}
          </div>
          <p style="color: #666; font-size: 14px; margin: 0;">
            Este PIN é válido por <strong>15 minutos</strong>
          </p>
        </div>
        
        <p><strong>⚠️ Importante:</strong></p>
        <ul>
          <li>Use este PIN para validar sua identidade e definir uma nova senha</li>
          <li>Não compartilhe este PIN com ninguém</li>
          <li>Se você não solicitou esta recuperação, ignore este email</li>
        </ul>
        
        <p style="margin-top: 30px;">Se precisar de ajuda, entre em contato com nossa equipe.</p>
        
        <p style="margin-top: 40px;">Atenciosamente,<br><strong>Equipe Boost Team</strong></p>
      </div>
    `;

    return this.emailService.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }
}
