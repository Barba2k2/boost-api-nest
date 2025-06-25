import { User } from '@domain/entities/user.entity';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

@Injectable()
export class UpdateLastLoginUseCase {
  private readonly logger = new Logger(UpdateLastLoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number): Promise<User> {
    this.logger.log(
      `[UPDATE_LAST_LOGIN] Atualizando último login para usuário ID: ${userId}`,
    );

    try {
      const user = await this.userRepository.updateLastLogin(userId);
      this.logger.log(
        `[UPDATE_LAST_LOGIN_SUCCESS] Último login atualizado com sucesso - ID: ${user.id}, Nick: ${user.nickname}, Novo lastLogin: ${user.lastLogin}`,
      );
      return user;
    } catch (error) {
      this.logger.error(
        `[UPDATE_LAST_LOGIN_ERROR] Erro ao atualizar último login - UserID: ${userId}, Erro: ${error.message}`,
      );
      throw error;
    }
  }
}
