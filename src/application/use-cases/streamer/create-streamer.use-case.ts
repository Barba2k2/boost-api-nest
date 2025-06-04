import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { Inject, Injectable } from '@nestjs/common';

export interface CreateStreamerCommand {
  userId: number;
  points?: number;
  platforms?: string[];
  streamDays?: string[];
}

@Injectable()
export class CreateStreamerUseCase {
  constructor(
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(command: CreateStreamerCommand): Promise<Streamer> {
    return await this.streamerRepository.create({
      userId: command.userId,
      points: command.points || 0,
      platforms: command.platforms || [],
      streamDays: command.streamDays || [],
    });
  }
}
