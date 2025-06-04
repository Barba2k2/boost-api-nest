import { User } from '@domain/entities/user.entity';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  UpdateTokensData,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

@Injectable()
export class UpdateUserTokensUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number, tokens: UpdateTokensData): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return await this.userRepository.updateTokens(id, tokens);
  }
}
