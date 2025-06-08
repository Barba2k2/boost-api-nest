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
        email: userData.email,
        fullName: userData.fullName,
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

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByEmailOrNickname(emailOrNickname: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrNickname }, { nickname: emailOrNickname }],
      },
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

  async updateLastLogin(id: number): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
      },
    });

    return this.toDomain(updatedUser);
  }

  async findUsersWithLogin(limit: number, offset: number): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        lastLogin: {
          not: null,
        },
      },
      orderBy: {
        lastLogin: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return users.map((user) => this.toDomain(user));
  }

  async countUsersWithLogin(): Promise<number> {
    return await this.prisma.user.count({
      where: {
        lastLogin: {
          not: null,
        },
      },
    });
  }

  async existsByNickname(nickname: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });

    return !!user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email },
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
      prismaUser.email,
      prismaUser.fullName,
      prismaUser.refreshToken,
      prismaUser.webToken,
      prismaUser.windowsToken,
      prismaUser.lastLogin,
      prismaUser.createdAt,
      prismaUser.updatedAt,
    );
  }
}
