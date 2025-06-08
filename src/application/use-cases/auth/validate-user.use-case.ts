import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User } from '@domain/entities/user.entity';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface ValidateUserCommand {
  emailOrNickname: string;
  password: string;
}

@Injectable()
export class ValidateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ValidateUserCommand): Promise<User> {
    const user = await this.userRepository.findByEmailOrNickname(
      command.emailOrNickname,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Usuário não encontrado ou senha inválida',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      command.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Usuário não encontrado ou senha inválida',
      );
    }

    return user;
  }
}
