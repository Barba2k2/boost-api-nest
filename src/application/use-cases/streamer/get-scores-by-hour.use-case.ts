import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
} from '@application/ports/repositories/score.repository.interface';
import { Inject, Injectable } from '@nestjs/common';

export interface GetScoresByHourCommand {
  date?: Date; // Se não informado, usa a data atual
}

export interface ScoresByHourResult {
  date: Date;
  streamers: Array<{
    streamerId: number;
    nickname: string;
    pointsByHour: { [hour: string]: number };
  }>;
}

@Injectable()
export class GetScoresByHourUseCase {
  constructor(
    @Inject(SCORE_REPOSITORY_TOKEN)
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async execute(command: GetScoresByHourCommand): Promise<ScoresByHourResult> {
    const date = command.date || new Date();

    const scoresData =
      await this.scoreRepository.getScoresByDateGroupedByHour(date);

    return {
      date,
      streamers: scoresData.map((data) => ({
        streamerId: data.streamerId,
        nickname: data.nickname,
        pointsByHour: data.pointsByHour,
      })),
    };
  }
}
