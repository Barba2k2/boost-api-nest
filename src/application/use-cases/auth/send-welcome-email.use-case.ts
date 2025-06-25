import { EmailService } from '@infrastructure/email/email.service';
import { Injectable, Logger } from '@nestjs/common';

export interface SendWelcomeEmailCommand {
  email: string;
  userName: string;
}

@Injectable()
export class SendWelcomeEmailUseCase {
  private readonly logger = new Logger(SendWelcomeEmailUseCase.name);

  constructor(private readonly emailService: EmailService) {}

  async execute(command: SendWelcomeEmailCommand): Promise<boolean> {
    try {
      this.logger.log(`Enviando email de boas-vindas para: ${command.email}`);

      const success = await this.emailService.sendWelcomeEmail(
        command.email,
        command.userName,
      );

      if (success) {
        this.logger.log(
          `Email de boas-vindas enviado com sucesso para: ${command.email}`,
        );
      } else {
        this.logger.warn(
          `Falha ao enviar email de boas-vindas para: ${command.email}`,
        );
      }

      return success;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar email de boas-vindas para ${command.email}:`,
        error,
      );
      return false;
    }
  }
}
