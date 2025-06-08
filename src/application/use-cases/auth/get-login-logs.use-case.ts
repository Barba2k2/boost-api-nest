import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from '../../ports/repositories/user.repository.interface';

export interface LoginLogEntry {
  userId: number;
  nickname: string;
  role: string;
  lastLogin: Date;
}

export interface GetLoginLogsQuery {
  limit?: number;
  offset?: number;
}

export interface GetLoginLogsResult {
  logs: LoginLogEntry[];
  total: number;
}

@Injectable()
export class GetLoginLogsUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetLoginLogsQuery = {}): Promise<GetLoginLogsResult> {
    const { limit = 50, offset = 0 } = query;

    // Buscar todos os usuários que já fizeram login
    const users = await this.userRepository.findUsersWithLogin(limit, offset);
    const total = await this.userRepository.countUsersWithLogin();

    const logs: LoginLogEntry[] = users.map((user) => ({
      userId: user.id,
      nickname: user.nickname,
      role: user.role,
      lastLogin: user.lastLogin!,
    }));

    return {
      logs,
      total,
    };
  }
}
