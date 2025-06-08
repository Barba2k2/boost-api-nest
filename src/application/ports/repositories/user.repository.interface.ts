import { User } from '@domain/entities/user.entity';

export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');

export interface CreateUserData {
  nickname: string;
  password: string;
  role: string;
  email: string;
  fullName: string;
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
  findByEmail(email: string): Promise<User | null>;
  findByEmailOrNickname(emailOrNickname: string): Promise<User | null>;
  updateTokens(id: number, tokens: UpdateTokensData): Promise<User>;
  updateLastLogin(id: number): Promise<User>;
  existsByNickname(nickname: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  findUsersWithLogin(limit: number, offset: number): Promise<User[]>;
  countUsersWithLogin(): Promise<number>;
}
