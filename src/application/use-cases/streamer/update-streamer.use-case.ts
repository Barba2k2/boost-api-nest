import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
  UpdateStreamerData,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

export interface UpdateStreamerCommand {
  id: number;
  points?: number;
  platforms?: string[];
  streamDays?: string[];
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
    if (command.points !== undefined) updateData.points = command.points;
    if (command.platforms !== undefined)
      updateData.platforms = command.platforms;
    if (command.streamDays !== undefined)
      updateData.streamDays = command.streamDays;

    return await this.streamerRepository.update(command.id, updateData);
  }
}
