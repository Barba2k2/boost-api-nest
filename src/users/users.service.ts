import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateTokensDto } from './dto/update-tokens.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Verificar se o usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { nickname: createUserDto.nickname },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já existe');
    }

    // Criar o usuário
    const user = await this.prisma.user.create({
      data: {
        nickname: createUserDto.nickname,
        password: createUserDto.password, // Já deve estar hasheado
        role: createUserDto.role,
        // Se for user ou admin, cria automaticamente um streamer
        ...(createUserDto.role === 'user' || createUserDto.role === 'admin'
          ? {
              streamer: {
                create: {
                  points: 0,
                  platforms: [],
                  streamDays: [],
                },
              },
            }
          : {}),
      },
      include: {
        streamer: true,
      },
    });

    return user;
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        streamer: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return user;
  }

  async findByNickname(nickname: string) {
    const user = await this.prisma.user.findUnique({
      where: { nickname },
      include: {
        streamer: true,
      },
    });

    return user;
  }

  async updateTokens(id: number, updateTokensDto: UpdateTokensDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        refreshToken: updateTokensDto.refreshToken,
        webToken: updateTokensDto.webToken,
        windowsToken: updateTokensDto.windowsToken,
      },
    });
  }
}
