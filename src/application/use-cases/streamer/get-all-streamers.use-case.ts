import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '@application/ports/repositories/streamer.repository.interface';
import { Streamer } from '@domain/entities/streamer.entity';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetAllStreamersUseCase {
  constructor(
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(): Promise<Streamer[]> {
    return await this.streamerRepository.findAll();
  }
}
