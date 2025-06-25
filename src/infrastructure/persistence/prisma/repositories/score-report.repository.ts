import {
  DailyScoreData,
  ScoreByHourData,
  ScoreReportData,
  WeeklyAverageData,
  WeeklyRankingData,
} from '@application/ports/repositories/score.repository.interface';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ScoreReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getScoreReportByPeriod(
    streamerId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ScoreReportData | null> {
    // Buscar o streamer com informações do usuário
    const streamer = await this.prisma.streamer.findUnique({
      where: { id: streamerId },
      include: { user: true },
    });

    if (!streamer) {
      return null;
    }

    // Buscar todos os scores no período com filtro de data/hora completo
    const scores = await this.prisma.score.findMany({
      where: {
        streamerId,
        OR: [
          {
            date: {
              gt: startDate,
              lt: endDate,
            },
          },
          {
            AND: [
              { date: { equals: startDate } },
              {
                OR: [
                  { hour: { gt: startDate.getHours() } },
                  {
                    AND: [
                      { hour: { equals: startDate.getHours() } },
                      { minute: { gte: startDate.getMinutes() } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            AND: [
              { date: { equals: endDate } },
              {
                OR: [
                  { hour: { lt: endDate.getHours() } },
                  {
                    AND: [
                      { hour: { equals: endDate.getHours() } },
                      { minute: { lte: endDate.getMinutes() } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      orderBy: [{ date: 'asc' }, { hour: 'asc' }, { minute: 'asc' }],
    });

    // Calcular total de pontos
    const totalPoints = scores.reduce((sum, score) => sum + score.points, 0);

    return {
      streamerId: streamer.id,
      nickname: streamer.user.nickname,
      totalPoints,
      startDate,
      endDate,
      registrationDate: streamer.user.createdAt,
      scores: scores.map((score) => ({
        id: score.id,
        points: score.points,
        date: score.date,
        hour: score.hour,
        minute: score.minute,
      })),
    };
  }

  async getScoresByDateGroupedByHour(date: Date): Promise<ScoreByHourData[]> {
    // Criar o início e fim do dia
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar todos os scores do dia com informações do streamer/usuário
    const scores = await this.prisma.score.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        streamer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ streamerId: 'asc' }, { hour: 'asc' }],
    });

    // Agrupar por streamer e depois por hora
    const groupedData = new Map<number, ScoreByHourData>();

    scores.forEach((score) => {
      const streamerId = score.streamerId;
      const hourKey = `${score.hour}h`;

      if (!groupedData.has(streamerId)) {
        groupedData.set(streamerId, {
          streamerId,
          nickname: score.streamer.user.nickname,
          pointsByHour: {},
        });
      }

      const streamerData = groupedData.get(streamerId)!;

      if (!streamerData.pointsByHour[hourKey]) {
        streamerData.pointsByHour[hourKey] = 0;
      }

      streamerData.pointsByHour[hourKey] += score.points;
    });

    return Array.from(groupedData.values());
  }

  async getWeeklyRanking(
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyRankingData[]> {
    // Buscar pontos agrupados por streamer no período
    const scoresGrouped = await this.prisma.score.groupBy({
      by: ['streamerId'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        points: {
          gt: 0, // Só contar pontos positivos para o ranking
        },
      },
      _sum: {
        points: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          points: 'desc',
        },
      },
    });

    // Buscar informações dos streamers
    const ranking: WeeklyRankingData[] = [];

    for (let i = 0; i < scoresGrouped.length; i++) {
      const group = scoresGrouped[i];
      const streamer = await this.prisma.streamer.findUnique({
        where: { id: group.streamerId },
        include: { user: true },
      });

      if (streamer) {
        // Calcular dias únicos com pontos
        const uniqueDays = await this.prisma.score.groupBy({
          by: ['date'],
          where: {
            streamerId: group.streamerId,
            date: {
              gte: startDate,
              lte: endDate,
            },
            points: {
              gt: 0,
            },
          },
        });

        const totalPoints = group._sum.points || 0;
        const daysWithPoints = uniqueDays.length;
        const averagePoints =
          daysWithPoints > 0 ? totalPoints / daysWithPoints : 0;

        ranking.push({
          position: i + 1,
          streamerId: streamer.id,
          nickname: streamer.user.nickname,
          totalPoints,
          averagePoints: Math.round(averagePoints * 100) / 100,
          dailyPoints: {}, // Será preenchido se necessário
        });
      }
    }

    return ranking;
  }

  async getWeeklyAverage(
    streamerId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyAverageData | null> {
    // Verificar se o streamer existe
    const streamer = await this.prisma.streamer.findUnique({
      where: { id: streamerId },
      include: { user: true },
    });

    if (!streamer) {
      return null;
    }

    // Buscar pontos agrupados por dia
    const dailyScores = await this.prisma.score.groupBy({
      by: ['date'],
      where: {
        streamerId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        points: {
          gt: 0, // Só contar pontos positivos
        },
      },
      _sum: {
        points: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const totalPoints = dailyScores.reduce(
      (sum, day) => sum + (day._sum.points || 0),
      0,
    );
    const daysWithPoints = dailyScores.length;
    const averagePoints = daysWithPoints > 0 ? totalPoints / daysWithPoints : 0;

    // Mapear pontos por dia da semana
    const dailyBreakdown: { [day: string]: number } = {};
    dailyScores.forEach((day) => {
      const dayOfWeek = day.date.toLocaleDateString('pt-BR', {
        weekday: 'long',
      });
      dailyBreakdown[dayOfWeek] = day._sum.points || 0;
    });

    return {
      streamerId: streamer.id,
      nickname: streamer.user.nickname,
      totalPoints,
      averagePoints: Math.round(averagePoints * 100) / 100,
      daysWithPoints,
      dailyBreakdown,
    };
  }

  async getDailyScoresForWeek(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyScoreData[]> {
    // Buscar pontos agrupados por data
    const dailyScores = await this.prisma.score.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        points: {
          gt: 0, // Só contar pontos positivos
        },
      },
      _sum: {
        points: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const result: DailyScoreData[] = [];

    for (const dailyScore of dailyScores) {
      // Buscar streamers que pontuaram neste dia
      const streamersGrouped = await this.prisma.score.groupBy({
        by: ['streamerId'],
        where: {
          date: dailyScore.date,
          points: {
            gt: 0,
          },
        },
        _sum: {
          points: true,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
      });

      const streamers: Array<{
        streamerId: number;
        nickname: string;
        points: number;
      }> = [];
      for (const streamerGroup of streamersGrouped) {
        const streamer = await this.prisma.streamer.findUnique({
          where: { id: streamerGroup.streamerId },
          include: { user: true },
        });

        if (streamer) {
          streamers.push({
            streamerId: streamer.id,
            nickname: streamer.user.nickname,
            points: streamerGroup._sum.points || 0,
          });
        }
      }

      result.push({
        date: dailyScore.date,
        dayOfWeek: dailyScore.date.toLocaleDateString('pt-BR', {
          weekday: 'long',
        }),
        streamers,
      });
    }

    return result;
  }
}
