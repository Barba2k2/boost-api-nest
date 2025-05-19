import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStreamerDto } from './dto/create-streamer.dto';
import { UpdateStreamerDto } from './dto/update-streamer.dto';

@Injectable()
export class StreamersService {
  constructor(private prisma: PrismaService) {}

  async create(createStreamerDto: CreateStreamerDto) {
    // Verificar se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: createStreamerDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `Usuário com ID ${createStreamerDto.userId} não encontrado`,
      );
    }

    // Criar o streamer com relações
    const streamer = await this.prisma.streamer.create({
      data: {
        userId: createStreamerDto.userId,
        points: createStreamerDto.points || 0,
        platforms: createStreamerDto.platforms || [],
        usualStartTime: createStreamerDto.usualStartTime,
        usualEndTime: createStreamerDto.usualEndTime,
        streamDays: createStreamerDto.streamDays || [],
        // Criar o social media se fornecido
        ...(createStreamerDto.socialMedia
          ? {
              socialMedia: {
                create: {
                  twitchChannel: createStreamerDto.socialMedia.twitchChannel,
                  youtubeChannel: createStreamerDto.socialMedia.youtubeChannel,
                  instagramHandle:
                    createStreamerDto.socialMedia.instagramHandle,
                  tiktokHandle: createStreamerDto.socialMedia.tiktokHandle,
                  facebookPage: createStreamerDto.socialMedia.facebookPage,
                },
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            role: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            lastLogin: true,
          },
        },
        socialMedia: true,
      },
    });

    return streamer;
  }

  findAll() {
    return this.prisma.streamer.findMany({
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            role: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            lastLogin: true,
          },
        },
        socialMedia: true,
      },
    });
  }

  async findOne(id: number) {
    const streamer = await this.prisma.streamer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            role: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            lastLogin: true,
          },
        },
        socialMedia: true,
      },
    });

    if (!streamer) {
      throw new NotFoundException(`Streamer com ID ${id} não encontrado`);
    }

    return streamer;
  }

  async update(id: number, updateStreamerDto: UpdateStreamerDto) {
    // Verificar se o streamer existe
    const streamer = await this.prisma.streamer.findUnique({
      where: { id },
      include: {
        socialMedia: true,
      },
    });

    if (!streamer) {
      throw new NotFoundException(`Streamer com ID ${id} não encontrado`);
    }

    // Atualizar dados do usuário se necessário
    if (updateStreamerDto.userData) {
      await this.prisma.user.update({
        where: { id: streamer.userId },
        data: {
          nickname: updateStreamerDto.userData.nickname,
          fullName: updateStreamerDto.userData.fullName,
          email: updateStreamerDto.userData.email,
          phone: updateStreamerDto.userData.phone,
          role: updateStreamerDto.userData.role,
          ...(updateStreamerDto.userData.password
            ? { password: updateStreamerDto.userData.password }
            : {}),
        },
      });
    }

    // Atualizar dados do streamer
    const updatedStreamer = await this.prisma.streamer.update({
      where: { id },
      data: {
        platforms: updateStreamerDto.platforms,
        usualStartTime: updateStreamerDto.usualStartTime,
        usualEndTime: updateStreamerDto.usualEndTime,
        streamDays: updateStreamerDto.streamDays,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            role: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            lastLogin: true,
          },
        },
        socialMedia: true,
      },
    });

    // Atualizar ou criar social media
    if (updateStreamerDto.socialMedia) {
      if (streamer.socialMedia) {
        await this.prisma.socialMedia.update({
          where: { streamerId: id },
          data: {
            twitchChannel: updateStreamerDto.socialMedia.twitchChannel,
            youtubeChannel: updateStreamerDto.socialMedia.youtubeChannel,
            instagramHandle: updateStreamerDto.socialMedia.instagramHandle,
            tiktokHandle: updateStreamerDto.socialMedia.tiktokHandle,
            facebookPage: updateStreamerDto.socialMedia.facebookPage,
          },
        });
      } else {
        await this.prisma.socialMedia.create({
          data: {
            streamerId: id,
            twitchChannel: updateStreamerDto.socialMedia.twitchChannel,
            youtubeChannel: updateStreamerDto.socialMedia.youtubeChannel,
            instagramHandle: updateStreamerDto.socialMedia.instagramHandle,
            tiktokHandle: updateStreamerDto.socialMedia.tiktokHandle,
            facebookPage: updateStreamerDto.socialMedia.facebookPage,
          },
        });
      }
    }

    return updatedStreamer;
  }

  async remove(id: number) {
    const streamer = await this.prisma.streamer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!streamer) {
      throw new NotFoundException(`Streamer com ID ${id} não encontrado`);
    }

    // Remover relações primeiro
    await this.prisma.socialMedia.deleteMany({
      where: { streamerId: id },
    });

    // Remover o streamer
    await this.prisma.streamer.delete({
      where: { id },
    });

    // Remover o usuário associado
    await this.prisma.user.delete({
      where: { id: streamer.userId },
    });

    return { message: 'Streamer removido com sucesso' };
  }

  async updateStatus(id: number, isActive: boolean) {
    const streamer = await this.prisma.streamer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!streamer) {
      throw new NotFoundException(`Streamer com ID ${id} não encontrado`);
    }

    await this.prisma.user.update({
      where: { id: streamer.userId },
      data: {
        status: isActive,
        lastLogin: new Date(),
      },
    });

    return { message: 'Status atualizado com sucesso' };
  }

  async getAllStreamersStatus() {
    const streamers = await this.prisma.streamer.findMany({
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            status: true,
            lastLogin: true,
          },
        },
      },
    });

    return streamers.map((streamer) => ({
      streamerId: streamer.id,
      nickname: streamer.user.nickname,
      status: streamer.user.status ? 'online' : 'offline',
      last_login: streamer.user.lastLogin,
      last_login_date: streamer.user.lastLogin
        ? this.formatDate(this.ensureDate(streamer.user.lastLogin))
        : null,
      last_login_time: streamer.user.lastLogin
        ? this.formatTime(this.ensureDate(streamer.user.lastLogin))
        : null,
    }));
  }

  private ensureDate(date: any): Date {
    if (date instanceof Date) {
      return date;
    }
    return new Date(String(date));
  }

  private formatDate(date: Date): string {
    // Ajustar para o fuso horário GMT-3 (Brasil)
    const brazilDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
    return brazilDate.toISOString().split('T')[0];
  }

  private formatTime(date: Date): string {
    // Ajustar para o fuso horário GMT-3 (Brasil)
    const brazilDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
    return brazilDate.toISOString().split('T')[1].substring(0, 5);
  }
}
