import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
  WeeklyRankingData,
} from '@application/ports/repositories/score.repository.interface';
import { Inject, Injectable } from '@nestjs/common';

export interface GetWeeklyRankingCommand {
  startDate: Date;
  endDate: Date;
}

export interface WeeklyRankingResult {
  startDate: Date;
  endDate: Date;
  ranking: WeeklyRankingData[];
}

@Injectable()
export class GetWeeklyRankingUseCase {
  constructor(
    @Inject(SCORE_REPOSITORY_TOKEN)
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async execute(
    command: GetWeeklyRankingCommand,
  ): Promise<WeeklyRankingResult> {
    const { startDate, endDate } = command;

    // Validar que a data de início não é posterior à data de fim
    if (startDate > endDate) {
      throw new Error('Data de início não pode ser posterior à data de fim');
    }

    const ranking = await this.scoreRepository.getWeeklyRanking(
      startDate,
      endDate,
    );

    return {
      startDate,
      endDate,
      ranking,
    };
  }
}
