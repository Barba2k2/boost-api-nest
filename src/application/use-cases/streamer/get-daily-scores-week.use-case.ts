import {
  DailyScoreData,
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
} from '@application/ports/repositories/score.repository.interface';
import { Inject, Injectable } from '@nestjs/common';

export interface GetDailyScoresWeekCommand {
  startDate: Date;
  endDate: Date;
}

export interface DailyScoresWeekResult {
  startDate: Date;
  endDate: Date;
  dailyScores: DailyScoreData[];
}

@Injectable()
export class GetDailyScoresWeekUseCase {
  constructor(
    @Inject(SCORE_REPOSITORY_TOKEN)
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async execute(
    command: GetDailyScoresWeekCommand,
  ): Promise<DailyScoresWeekResult> {
    const { startDate, endDate } = command;

    // Validar que a data de início não é posterior à data de fim
    if (startDate > endDate) {
      throw new Error('Data de início não pode ser posterior à data de fim');
    }

    const dailyScores = await this.scoreRepository.getDailyScoresForWeek(
      startDate,
      endDate,
    );

    return {
      startDate,
      endDate,
      dailyScores,
    };
  }
}
