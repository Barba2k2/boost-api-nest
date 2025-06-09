import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IScoreRepository,
  SCORE_REPOSITORY_TOKEN,
  ScoreReportData,
} from '../../ports/repositories/score.repository.interface';
import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
} from '../../ports/repositories/streamer.repository.interface';

export interface GetReportByNicknameCommand {
  nickname: string;
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class GetReportByNicknameUseCase {
  constructor(
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
    @Inject(SCORE_REPOSITORY_TOKEN)
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async execute(
    command: GetReportByNicknameCommand,
  ): Promise<ScoreReportData | null> {
    // Validar que a data de início não é posterior à data de fim
    if (command.startDate > command.endDate) {
      throw new Error('Data de início não pode ser posterior à data de fim');
    }

    // Buscar streamer pelo nickname
    const streamer = await this.streamerRepository.findByNickname(
      command.nickname,
    );

    if (!streamer) {
      throw new NotFoundException(
        `Streamer com nickname '${command.nickname}' não encontrado`,
      );
    }

    // Buscar relatório do período usando o método existente
    const reportData = await this.scoreRepository.getScoreReportByPeriod(
      streamer.id,
      command.startDate,
      command.endDate,
    );

    return reportData;
  }
}
