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
import * as bcrypt from 'bcrypt';

export interface ResetPasswordCommand {
  emailOrNickname: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<ResetPasswordResult> {
    try {
      // Validar confirmação de senha
      if (command.newPassword !== command.confirmPassword) {
        throw new BadRequestException('As senhas não coincidem');
      }

      // Validar força da senha
      this.validatePasswordStrength(command.newPassword);

      // Buscar usuário
      const user = await this.userRepository.findByEmailOrNickname(
        command.emailOrNickname,
      );

      if (!user) {
        throw new BadRequestException('Token inválido ou expirado');
      }

      // Verificar token de reset no Redis
      const resetTokenKey = `password_reset_token:${user.id}`;
      const storedToken = await this.redisService.get<string>(resetTokenKey);

      if (!storedToken || storedToken !== command.resetToken) {
        this.logger.warn(
          `Tentativa de reset com token inválido para usuário ${user.id}`,
        );
        throw new BadRequestException('Token inválido ou expirado');
      }

      // Verificar se a nova senha é diferente da atual
      const isSamePassword = await bcrypt.compare(
        command.newPassword,
        user.password,
      );

      if (isSamePassword) {
        throw new BadRequestException(
          'A nova senha deve ser diferente da senha atual',
        );
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(command.newPassword, 10);

      // Atualizar senha no banco de dados
      await this.userRepository.updatePassword(user.id, hashedPassword);

      // Remover token de reset (não pode ser reutilizado)
      await this.redisService.del(resetTokenKey);

      // Enviar email de confirmação
      await this.sendPasswordChangedNotification(
        user.email!,
        user.fullName || user.nickname,
      ).catch((error) => {
        this.logger.warn(
          `Falha ao enviar email de confirmação para usuário ${user.id}: ${error.message}`,
        );
      });

      this.logger.log(`Senha alterada com sucesso para usuário ${user.id}`);

      return {
        success: true,
        message:
          'Senha alterada com sucesso. Você pode fazer login com a nova senha.',
      };
    } catch (error) {
      this.logger.error(`Erro ao alterar senha: ${error.message}`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Erro interno. Tente novamente mais tarde.',
      );
    }
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException(
        `A senha deve ter pelo menos ${minLength} caracteres`,
      );
    }

    if (!hasUpperCase) {
      throw new BadRequestException(
        'A senha deve conter pelo menos uma letra maiúscula',
      );
    }

    if (!hasLowerCase) {
      throw new BadRequestException(
        'A senha deve conter pelo menos uma letra minúscula',
      );
    }

    if (!hasNumbers) {
      throw new BadRequestException('A senha deve conter pelo menos um número');
    }

    if (!hasSpecialChar) {
      throw new BadRequestException(
        'A senha deve conter pelo menos um caractere especial',
      );
    }
  }

  private async sendPasswordChangedNotification(
    email: string,
    userName: string,
  ): Promise<boolean> {
    const subject = 'Senha alterada com sucesso - Clã Boost';
    const text = `Olá ${userName},\n\nSua senha foi alterada com sucesso.\n\nSe você não fez esta alteração, entre em contato conosco imediatamente.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #28a745;">Senha alterada com sucesso!</h2>
        <p>Olá, <strong>${userName}</strong>!</p>
        
        <p>Sua senha da <strong>Boost Team</strong> foi alterada com sucesso.</p>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>✅ Confirmação:</strong> Sua senha foi atualizada em ${new Date().toLocaleString('pt-BR')}
        </div>
        
        <p><strong>⚠️ Importante:</strong></p>
        <ul>
          <li>Se você não fez esta alteração, entre em contato conosco imediatamente</li>
          <li>Mantenha sua senha segura e não a compartilhe com ninguém</li>
          <li>Considere usar um gerenciador de senhas para maior segurança</li>
        </ul>
        
        <p style="margin-top: 30px;">Se você tem alguma dúvida ou preocupação sobre a segurança da sua conta, entre em contato conosco.</p>
        
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
