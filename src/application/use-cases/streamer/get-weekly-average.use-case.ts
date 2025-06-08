import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
} from '@application/ports/repositories/score.repository.interface';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

export interface GetWeeklyAverageCommand {
  streamerId: number;
  startDate: Date;
  endDate: Date;
}

export interface WeeklyAverageResult {
  streamerId: number;
  nickname: string;
  totalPoints: number;
  daysWithPoints: number;
  averagePoints: number;
  dailyBreakdown: { [day: string]: number };
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class GetWeeklyAverageUseCase {
  constructor(
    @Inject(SCORE_REPOSITORY_TOKEN)
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async execute(
    command: GetWeeklyAverageCommand,
  ): Promise<WeeklyAverageResult> {
    const { streamerId, startDate, endDate } = command;

    // Validar que a data de início não é posterior à data de fim
    if (startDate > endDate) {
      throw new Error('Data de início não pode ser posterior à data de fim');
    }

    const averageData = await this.scoreRepository.getWeeklyAverage(
      streamerId,
      startDate,
      endDate,
    );

    if (!averageData) {
      throw new NotFoundException(
        `Streamer com ID ${streamerId} não encontrado`,
      );
    }

    return {
      ...averageData,
      startDate,
      endDate,
    };
  }
}
