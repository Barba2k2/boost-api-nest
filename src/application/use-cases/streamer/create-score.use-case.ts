import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
} from '@application/ports/repositories/score.repository.interface';
import { Score } from '@domain/entities/score.entity';
import { Inject, Injectable } from '@nestjs/common';

export interface CreateScoreCommand {
  streamerId: number;
  date: Date;
  hour: number;
  minute: number;
  points: number;
}

@Injectable()
export class CreateScoreUseCase {
  constructor(
    @Inject(SCORE_REPOSITORY_TOKEN)
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async execute(command: CreateScoreCommand): Promise<Score> {
    return await this.scoreRepository.create({
      streamerId: command.streamerId,
      date: command.date,
      hour: command.hour,
      minute: command.minute,
      points: command.points,
    });
  }
}
