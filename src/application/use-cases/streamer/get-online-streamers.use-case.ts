import { Streamer } from '@domain/entities/streamer.entity';
import { Inject, Injectable } from '@nestjs/common';
import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '../../ports/repositories/streamer.repository.interface';

@Injectable()
export class GetOnlineStreamersUseCase {
  constructor(
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(): Promise<Streamer[]> {
    return await this.streamerRepository.findOnlineStreamers();
  }
}
