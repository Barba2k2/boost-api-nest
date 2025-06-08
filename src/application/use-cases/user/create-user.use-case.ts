import { User, UserRole } from '@domain/entities/user.entity';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '../../ports/repositories/streamer.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

export interface CreateUserCommand {
  fullName: string;
  nickname: string;
  email: string;
  password: string; // Já deve estar hasheado
  role: UserRole;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // Verificar se o usuário já existe por nickname
    const existingUserByNickname = await this.userRepository.existsByNickname(
      command.nickname,
    );
    if (existingUserByNickname) {
      throw new ConflictException('Nickname já está em uso');
    }

    // Verificar se o email já existe
    const existingUserByEmail = await this.userRepository.existsByEmail(
      command.email,
    );
    if (existingUserByEmail) {
      throw new ConflictException('Email já está em uso');
    }

    // Criar o usuário
    const user = await this.userRepository.create({
      fullName: command.fullName,
      nickname: command.nickname,
      email: command.email,
      password: command.password,
      role: command.role,
    });

    // Se for user ou admin, cria automaticamente um streamer
    if (user.canCreateStreamer()) {
      await this.streamerRepository.create({
        userId: user.id,
        points: 0,
        platforms: [],
        streamDays: [],
      });
    }

    return user;
  }
}
