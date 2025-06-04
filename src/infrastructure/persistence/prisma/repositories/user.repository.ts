import { User, UserRole } from '@domain/entities/user.entity';
import { Injectable } from '@nestjs/common';
import {
  CreateUserData,
  IUserRepository,
  UpdateTokensData,
} from '../../../../application/ports/repositories/user.repository.interface';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userData: CreateUserData): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        nickname: userData.nickname,
        password: userData.password,
        role: userData.role,
      },
    });

    return this.toDomain(createdUser);
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByNickname(nickname: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { nickname },
    });

    return user ? this.toDomain(user) : null;
  }

  async updateTokens(id: number, tokens: UpdateTokensData): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        refreshToken: tokens.refreshToken,
        webToken: tokens.webToken,
        windowsToken: tokens.windowsToken,
      },
    });

    return this.toDomain(updatedUser);
  }

  async existsByNickname(nickname: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });

    return !!user;
  }

  private toDomain(prismaUser: any): User {
    return new User(
      prismaUser.id,
      prismaUser.nickname,
      prismaUser.password,
      prismaUser.role as UserRole,
      prismaUser.refreshToken,
      prismaUser.webToken,
      prismaUser.windowsToken,
      prismaUser.createdAt,
      prismaUser.updatedAt,
    );
  }
}
