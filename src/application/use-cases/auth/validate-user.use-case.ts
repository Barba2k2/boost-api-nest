import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/user.repository.interface';
import { User } from '@domain/entities/user.entity';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface ValidateUserCommand {
  emailOrNickname: string;
  password: string;
}

@Injectable()
export class ValidateUserUseCase {
  private readonly logger = new Logger(ValidateUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ValidateUserCommand): Promise<User> {
    this.logger.log(
      `[USER_VALIDATION] Buscando usuário: ${command.emailOrNickname}`,
    );

    const user = await this.userRepository.findByEmailOrNickname(
      command.emailOrNickname,
    );

    if (!user) {
      this.logger.warn(
        `[USER_VALIDATION_FAILED] Usuário não encontrado: ${command.emailOrNickname}`,
      );
      throw new UnauthorizedException(
        'Usuário não encontrado ou senha inválida',
      );
    }

    this.logger.log(
      `[USER_VALIDATION] Usuário encontrado - ID: ${user.id}, Nick: ${user.nickname}, Role: ${user.role}, Status: ${user.status}`,
    );

    if (!user.status) {
      this.logger.warn(
        `[USER_VALIDATION_FAILED] Usuário inativo - ID: ${user.id}, Nick: ${user.nickname}`,
      );
      throw new UnauthorizedException(
        'Conta desativada. Entre em contato com o suporte.',
      );
    }

    this.logger.log(
      `[PASSWORD_VALIDATION] Validando senha para usuário ID: ${user.id}`,
    );

    const isPasswordValid = await bcrypt.compare(
      command.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `[PASSWORD_VALIDATION_FAILED] Senha inválida para usuário - ID: ${user.id}, Nick: ${user.nickname}`,
      );
      throw new UnauthorizedException(
        'Usuário não encontrado ou senha inválida',
      );
    }

    this.logger.log(
      `[USER_VALIDATION_SUCCESS] Validação completa com sucesso - ID: ${user.id}, Nick: ${user.nickname}, Role: ${user.role}`,
    );

    return user;
  }
}
