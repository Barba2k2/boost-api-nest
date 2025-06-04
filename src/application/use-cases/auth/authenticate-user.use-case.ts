import { User } from '@domain/entities/user.entity';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

export interface AuthenticateCommand {
  nickname: string;
  password: string;
}

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: AuthenticateCommand): Promise<User> {
    const user = await this.userRepository.findByNickname(command.nickname);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return user;
  }
}
