import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface MailgunResponse {
  id: string;
  message: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mailgun: any;
  private readonly domain: string;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    this.domain =
      this.configService.get<string>('MAILGUN_DOMAIN') || 'boost-twitch.com';
    this.fromEmail = `Boost Team <postmaster@${this.domain}>`;

    if (!apiKey) {
      this.logger.warn(
        'MAILGUN_API_KEY não configurada. Emails não serão enviados.',
      );
      return;
    }

    const mg = new Mailgun(formData);
    this.mailgun = mg.client({
      username: 'api',
      key: apiKey,
      url:
        this.configService.get<string>('MAILGUN_API_URL') ||
        'https://api.mailgun.net',
    });

    this.logger.log('EmailService inicializado com Mailgun');
  }

  async sendEmail(options: EmailOptions): Promise<MailgunResponse | null> {
    if (!this.mailgun) {
      this.logger.warn('Mailgun não configurado. Email não enviado.');
      return null;
    }

    try {
      const emailData = {
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      this.logger.log(`Enviando email para: ${options.to}`);

      const response = await this.mailgun.messages.create(
        this.domain,
        emailData,
      );

      this.logger.log(`Email enviado com sucesso. ID: ${response.id}`);

      return response;
    } catch (error) {
      this.logger.error(`Erro ao enviar email para ${options.to}:`, error);
      return null;
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const subject = 'Bem vindo ao Clã Boost';
    const text = `Bem vindo a boost team!!\n\nOlá ${userName},\n\nSeja bem-vindo(a) ao Clã Boost! Estamos muito felizes em tê-lo(a) como parte da nossa equipe.\n\nAproveite sua jornada conosco!\n\nEquipe Boost`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Bem vindo a boost team!!</h1>
        <p>Olá <strong>${userName}</strong>,</p>
        <p>Seja bem-vindo(a) ao <strong>Clã Boost</strong>! Estamos muito felizes em tê-lo(a) como parte da nossa equipe.</p>
        <p>Aproveite sua jornada conosco!</p>
        <br>
        <p>Atenciosamente,<br><strong>Equipe Boost</strong></p>
      </div>
    `;

    const result = await this.sendEmail({
      to,
      subject,
      text,
      html,
    });

    return result !== null;
  }
}
