import { User, UserRole } from '@domain/entities/user.entity';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserUseCase } from '../user/create-user.use-case';

export interface RegisterUserCommand {
  nickname: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(command.password, 10);

    // Criar o usuário usando o caso de uso existente
    const user = await this.createUserUseCase.execute({
      nickname: command.nickname,
      password: hashedPassword,
      role: command.role,
    });

    return user;
  }
}
