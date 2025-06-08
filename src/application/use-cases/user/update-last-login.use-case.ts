import { User } from '@domain/entities/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

@Injectable()
export class UpdateLastLoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: number): Promise<User> {
    return await this.userRepository.updateLastLogin(userId);
  }
}
