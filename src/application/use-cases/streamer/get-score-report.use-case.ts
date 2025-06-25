import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
} from '@application/ports/repositories/score.repository.interface';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

export interface GetScoreReportCommand {
  streamerId: number;
  startDate: Date;
  endDate: Date;
}

export interface ScoreReportResult {
  streamerId: number;
  nickname: string;
  totalPoints: number;
  startDate: Date;
  endDate: Date;
  registrationDate: Date;
  scores: Array<{
    id: number;
    points: number;
    date: Date;
    hour: number;
    minute: number;
  }>;
}

@Injectable()
export class GetScoreReportUseCase {
  constructor(
    @Inject(SCORE_REPOSITORY_TOKEN)
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async execute(command: GetScoreReportCommand): Promise<ScoreReportResult> {
    const { streamerId, startDate, endDate } = command;

    // Validar que a data de início não é posterior à data de fim
    if (startDate > endDate) {
      throw new Error('Data de início não pode ser posterior à data de fim');
    }

    const reportData = await this.scoreRepository.getScoreReportByPeriod(
      streamerId,
      startDate,
      endDate,
    );

    if (!reportData) {
      throw new NotFoundException(
        `Streamer com ID ${streamerId} não encontrado`,
      );
    }

    return {
      streamerId: reportData.streamerId,
      nickname: reportData.nickname,
      totalPoints: reportData.totalPoints,
      startDate: reportData.startDate,
      endDate: reportData.endDate,
      registrationDate: reportData.registrationDate,
      scores: reportData.scores,
    };
  }
}
