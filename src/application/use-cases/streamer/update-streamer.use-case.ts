import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
  UpdateStreamerData,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

export interface UpdateStreamerCommand {
  id: number;
  nickname?: string;
  platforms?: string[];
  streamDays?: string[];
  startTime?: string;
  endTime?: string;
}

@Injectable()
export class UpdateStreamerUseCase {
  constructor(
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(command: UpdateStreamerCommand): Promise<Streamer> {
    const existingStreamer = await this.streamerRepository.findById(command.id);

    if (!existingStreamer) {
      throw new NotFoundException(
        `Streamer com ID ${command.id} não encontrado`,
      );
    }

    const updateData: UpdateStreamerData = {};
    if (command.nickname !== undefined) updateData.nickname = command.nickname;
    if (command.platforms !== undefined)
      updateData.platforms = command.platforms;
    if (command.streamDays !== undefined)
      updateData.streamDays = command.streamDays;
    if (command.startTime !== undefined)
      updateData.startTime = command.startTime;
    if (command.endTime !== undefined) updateData.endTime = command.endTime;

    return await this.streamerRepository.update(command.id, updateData);
  }
}
