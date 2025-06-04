import { User } from '@domain/entities/user.entity';

export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');

export interface CreateUserData {
  nickname: string;
  password: string;
  role: string;
}

export interface UpdateTokensData {
  refreshToken?: string;
  webToken?: string;
  windowsToken?: string;
}

export interface IUserRepository {
  create(userData: CreateUserData): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByNickname(nickname: string): Promise<User | null>;
  updateTokens(id: number, tokens: UpdateTokensData): Promise<User>;
  existsByNickname(nickname: string): Promise<boolean>;
}
