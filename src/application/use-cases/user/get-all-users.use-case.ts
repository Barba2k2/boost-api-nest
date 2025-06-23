import { IUserRepository } from '@application/ports/repositories/user.repository.interface';
import { User } from '@domain/entities/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GetAllUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
