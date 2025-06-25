import { User } from '@domain/entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

export interface UpdateProfileCommand {
  userId: number;
  fullName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);

    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${command.userId} não encontrado`,
      );
    }

    // Verificar se nickname já existe (se foi fornecido e é diferente do atual)
    if (command.nickname && command.nickname !== user.nickname) {
      const existingUser = await this.userRepository.findByNickname(
        command.nickname,
      );
      if (existingUser) {
        throw new ConflictException('Este nickname já está em uso');
      }
    }

    // Verificar se email já existe (se foi fornecido e é diferente do atual)
    if (command.email && command.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(command.email);
      if (existingUser) {
        throw new ConflictException('Este email já está em uso');
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (command.fullName !== undefined) updateData.fullName = command.fullName;
    if (command.nickname !== undefined) updateData.nickname = command.nickname;
    if (command.email !== undefined) updateData.email = command.email;
    if (command.phone !== undefined) updateData.phone = command.phone;

    // Se não há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Nenhum dado fornecido para atualização');
    }

    return await this.userRepository.updateProfile(command.userId, updateData);
  }
}
