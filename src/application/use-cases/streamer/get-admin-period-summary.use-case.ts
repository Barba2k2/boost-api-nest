import { Injectable } from '@nestjs/common';
import { GetDailyScoresWeekUseCase } from './get-daily-scores-week.use-case';
import { GetWeeklyRankingUseCase } from './get-weekly-ranking.use-case';

export interface GetAdminPeriodSummaryCommand {
  startDate: Date;
  endDate: Date;
}

export interface AdminPeriodSummaryResult {
  period: {
    startDate: Date;
    endDate: Date;
    totalDays: number;
  };
  statistics: {
    totalStreamers: number;
    totalPoints: number;
    averagePointsPerStreamer: number;
    topStreamer: {
      nickname: string;
      totalPoints: number;
      averagePoints: number;
    } | null;
  };
  pointsByDay: { [day: string]: number };
  ranking: any[];
  dailyBreakdown: any[];
}

@Injectable()
export class GetAdminPeriodSummaryUseCase {
  constructor(
    private readonly getWeeklyRankingUseCase: GetWeeklyRankingUseCase,
    private readonly getDailyScoresWeekUseCase: GetDailyScoresWeekUseCase,
  ) {}

  async execute(
    command: GetAdminPeriodSummaryCommand,
  ): Promise<AdminPeriodSummaryResult> {
    const { startDate, endDate } = command;

    // Buscar dados em paralelo para otimizar performance
    const [ranking, dailyScores] = await Promise.all([
      this.getWeeklyRankingUseCase.execute({ startDate, endDate }),
      this.getDailyScoresWeekUseCase.execute({ startDate, endDate }),
    ]);

    // Calcular estatísticas gerais
    const totalStreamers = ranking.ranking.length;
    const totalPoints = ranking.ranking.reduce(
      (sum, streamer) => sum + streamer.totalPoints,
      0,
    );
    const averagePointsPerStreamer =
      totalStreamers > 0 ? totalPoints / totalStreamers : 0;
    const topStreamer = ranking.ranking[0] || null;

    // Calcular pontos por dia
    const pointsByDay = dailyScores.dailyScores.reduce(
      (acc, day) => {
        const dayTotal = day.streamers.reduce(
          (sum, streamer) => sum + streamer.points,
          0,
        );
        acc[day.dayOfWeek] = dayTotal;
        return acc;
      },
      {} as { [day: string]: number },
    );

    return {
      period: {
        startDate,
        endDate,
        totalDays: dailyScores.dailyScores.length,
      },
      statistics: {
        totalStreamers,
        totalPoints,
        averagePointsPerStreamer:
          Math.round(averagePointsPerStreamer * 100) / 100,
        topStreamer: topStreamer
          ? {
              nickname: topStreamer.nickname,
              totalPoints: topStreamer.totalPoints,
              averagePoints: topStreamer.averagePoints,
            }
          : null,
      },
      pointsByDay,
      ranking: ranking.ranking,
      dailyBreakdown: dailyScores.dailyScores,
    };
  }
}
