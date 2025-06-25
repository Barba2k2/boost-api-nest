import { User, UserRole } from '@domain/entities/user.entity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserUseCase } from '../user/create-user.use-case';
import { SendWelcomeEmailUseCase } from './send-welcome-email.use-case';

export interface RegisterUserCommand {
  fullName: string;
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
}

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly sendWelcomeEmailUseCase: SendWelcomeEmailUseCase,
  ) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    // Validar confirmação de senha
    if (command.password !== command.confirmPassword) {
      throw new BadRequestException('As senhas não coincidem');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(command.password, 10);

    // Criar o usuário usando o caso de uso existente
    const user = await this.createUserUseCase.execute({
      fullName: command.fullName,
      nickname: command.nickname,
      email: command.email,
      password: hashedPassword,
      role: command.role || UserRole.USER,
    });

    // Enviar email de boas-vindas (não bloqueia o registro se falhar)
    this.sendWelcomeEmailUseCase
      .execute({
        email: user.email!,
        userName: user.fullName!,
      })
      .catch((error) => {
        this.logger.error(
          `Falha ao enviar email de boas-vindas para ${user.email}:`,
          error,
        );
      });

    return user;
  }
}
