import { Streamer } from '@domain/entities/streamer.entity';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '../../ports/repositories/streamer.repository.interface';

export interface UpdateStreamerOnlineStatusCommand {
  streamerId: number;
  isOnline: boolean;
}

@Injectable()
export class UpdateStreamerOnlineStatusUseCase {
  constructor(
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(command: UpdateStreamerOnlineStatusCommand): Promise<Streamer> {
    const streamer = await this.streamerRepository.findById(command.streamerId);

    if (!streamer) {
      throw new NotFoundException('Streamer não encontrado');
    }

    return await this.streamerRepository.updateOnlineStatus(
      command.streamerId,
      command.isOnline,
    );
  }
}
