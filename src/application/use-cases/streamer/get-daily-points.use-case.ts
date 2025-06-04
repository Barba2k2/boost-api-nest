import { IScoreRepository } from '@application/ports/repositories/score.repository.interface';
import { Inject, Injectable } from '@nestjs/common';

export const SCORE_REPOSITORY_TOKEN = Symbol('IScoreRepository');

export interface GetDailyPointsCommand {
  streamerId: number;
  date?: Date; // Se não informado, usa a data atual
}

export interface DailyPointsResult {
  streamerId: number;
  date: Date;
  currentPoints: number;
  remainingPoints: number;
  dailyLimit: number;
}

@Injectable()
export class GetDailyPointsUseCase {
  private readonly DAILY_POINTS_LIMIT = 240;

  constructor(
    @Inject(SCORE_REPOSITORY_TOKEN)
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async execute(command: GetDailyPointsCommand): Promise<DailyPointsResult> {
    const date = command.date || new Date();

    const currentPoints =
      await this.scoreRepository.getDailyPointsByStreamerAndDate(
        command.streamerId,
        date,
      );

    return {
      streamerId: command.streamerId,
      date,
      currentPoints,
      remainingPoints: Math.max(0, this.DAILY_POINTS_LIMIT - currentPoints),
      dailyLimit: this.DAILY_POINTS_LIMIT,
    };
  }
}
