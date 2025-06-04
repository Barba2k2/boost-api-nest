import { IScoreRepository } from '@application/ports/repositories/score.repository.interface';
import { Score } from '@domain/entities/score.entity';
import { Inject, Injectable } from '@nestjs/common';

export const SCORE_REPOSITORY_TOKEN = Symbol('IScoreRepository');

export interface CreateScoreCommand {
  streamerId: number;
  points: number;
  reason: string;
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
      points: command.points,
      reason: command.reason,
    });
  }
}
