import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly domain: string;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('API_KEY') || '';
    this.domain = 'boost-twitch.com';
    this.fromEmail = `Boost Team <postmaster@${this.domain}>`;

    if (!this.apiKey) {
      this.logger.warn('API_KEY não configurada. Emails não serão enviados.');
    } else {
      this.logger.log('EmailService configurado com Mailgun direto via axios');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const form = new FormData();
      form.append('from', options.from || this.fromEmail);
      form.append('to', options.to);
      form.append('subject', options.subject);
      if (options.text) form.append('text', options.text);
      if (options.html) form.append('html', options.html);

      const response = await axios.post(
        `https://api.mailgun.net/v3/${this.domain}/messages`,
        form,
        {
          auth: {
            username: 'api',
            password: this.apiKey,
          },
          headers: form.getHeaders(),
        },
      );

      this.logger.log(`Email enviado com sucesso. ID: ${response.data.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(JSON.stringify(error.response.data));
      }
      return false;
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const subject = 'Bem vindo ao Clã Boost';
    const text = `Olá ${userName},\n\nSeja bem-vindo(a) ao Clã Boost!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2 style="color: #e63946;">Olá, ${userName}!</h2>
  <p>É oficial: você agora faz parte da <strong>Boost Team</strong> - uma comunidade feita para quem acredita em crescimento, troca verdadeira e conexões que impulsionam de verdade 💥</p>

  <p>Aqui a gente acredita que ninguém cresce sozinho. Seja para alcançar metas ousadas, tirar projetos do papel ou se conectar com pessoas incríveis que falam a mesma língua, você está no lugar certo.</p>

  <p><strong>O que te espera por aqui:</strong></p>
  <ul>
    <li>🤝 Apoio real da comunidade</li>
    <li>🔥 Conexões com gente que joga junto</li>
  </ul>

  <p>Se ainda estiver se ambientando, não se preocupe - a gente te dá um empurrãozinho. Logo, você vai se sentir em casa.</p>

  <p>
    👉 <a href="{{https://bit.ly/boostTeamCommunity}}" style="background-color: #1d3557; color: #fff; padding: 10px 16px; border-radius: 5px; text-decoration: none;">Entrar agora na comunidade</a>
  </p>

  <p style="margin-top: 30px;">Prepare-se para acelerar. Porque juntos, a gente não caminha - <strong>a gente decola</strong> 🚀</p>

  <p style="margin-top: 40px;">Seja muito bem-vindo(a) à Boost Team.<br>
  <strong>O melhor ainda está por vir.</strong></p>

  <p style="margin-top: 30px;">Com energia,<br><strong>Equipe Boost Team</strong></p>
</div>
    `;

    return this.sendEmail({ to, subject, text, html });
  }
}
