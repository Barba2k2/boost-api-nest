import { User } from '@domain/entities/user.entity';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

export interface ChangePasswordCommand {
  userId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);

    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${command.userId} não encontrado`,
      );
    }

    // Verificar se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(
      command.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Verificar se a nova senha e confirmação coincidem
    if (command.newPassword !== command.confirmPassword) {
      throw new BadRequestException('Nova senha e confirmação não coincidem');
    }

    // Verificar se a nova senha é diferente da atual
    const isSamePassword = await bcrypt.compare(
      command.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual',
      );
    }

    // Hash da nova senha
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(
      command.newPassword,
      saltRounds,
    );

    return await this.userRepository.updatePassword(
      command.userId,
      hashedNewPassword,
    );
  }
}
