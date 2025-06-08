import { Streamer } from '@domain/entities/streamer.entity';
import { Injectable } from '@nestjs/common';
import {
  CreateStreamerData,
  IStreamerRepository,
  UpdateStreamerData,
} from '../../../../application/ports/repositories/streamer.repository.interface';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class StreamerRepository implements IStreamerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(streamerData: CreateStreamerData): Promise<Streamer> {
    const createdStreamer = await this.prisma.streamer.create({
      data: {
        userId: streamerData.userId,
        points: streamerData.points || 0,
        platforms: streamerData.platforms || [],
        streamDays: streamerData.streamDays || [],
      },
    });

    return this.toDomain(createdStreamer);
  }

  async findById(id: number): Promise<Streamer | null> {
    const streamer = await this.prisma.streamer.findUnique({
      where: { id },
    });

    return streamer ? this.toDomain(streamer) : null;
  }

  async findByUserId(userId: number): Promise<Streamer | null> {
    const streamer = await this.prisma.streamer.findUnique({
      where: { userId },
    });

    return streamer ? this.toDomain(streamer) : null;
  }

  async findAll(): Promise<Streamer[]> {
    const streamers = await this.prisma.streamer.findMany();
    return streamers.map((streamer) => this.toDomain(streamer));
  }

  async update(id: number, data: UpdateStreamerData): Promise<Streamer> {
    const updatedStreamer = await this.prisma.streamer.update({
      where: { id },
      data: {
        points: data.points,
        platforms: data.platforms,
        streamDays: data.streamDays,
        isOnline: data.isOnline,
      },
    });

    return this.toDomain(updatedStreamer);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.streamer.delete({
      where: { id },
    });
  }

  async addPoints(id: number, points: number): Promise<Streamer> {
    const updatedStreamer = await this.prisma.streamer.update({
      where: { id },
      data: {
        points: {
          increment: points,
        },
      },
    });

    return this.toDomain(updatedStreamer);
  }

  async updateOnlineStatus(id: number, isOnline: boolean): Promise<Streamer> {
    const updatedStreamer = await this.prisma.streamer.update({
      where: { id },
      data: {
        isOnline,
      },
    });

    return this.toDomain(updatedStreamer);
  }

  async findOnlineStreamers(): Promise<Streamer[]> {
    const streamers = await this.prisma.streamer.findMany({
      where: {
        isOnline: true,
      },
    });

    return streamers.map((streamer) => this.toDomain(streamer));
  }

  private toDomain(prismaStreamer: any): Streamer {
    return new Streamer(
      prismaStreamer.id,
      prismaStreamer.userId,
      prismaStreamer.points,
      prismaStreamer.platforms,
      prismaStreamer.streamDays,
      prismaStreamer.isOnline || false,
      prismaStreamer.createdAt,
      prismaStreamer.updatedAt,
    );
  }
}
