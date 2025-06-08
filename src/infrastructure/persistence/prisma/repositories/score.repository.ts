import {
  CreateScoreData,
  DailyScoreData,
  IScoreRepository,
  ScoreByHourData,
  ScoreReportData,
  WeeklyAverageData,
  WeeklyRankingData,
} from '@application/ports/repositories/score.repository.interface';
import { Score } from '@domain/entities/score.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ScoreRepository implements IScoreRepository {
  private readonly DAILY_POINTS_LIMIT = 240;

  constructor(private readonly prisma: PrismaService) {}

  async create(scoreData: CreateScoreData): Promise<Score> {
    // Converter a data string para Date object se necessário
    const scoreDate = new Date(scoreData.date);

    // 1. Verificar se já existe score nos últimos 6 minutos para este streamer
    await this.validateNoDuplicateInLastSixMinutes(
      scoreData.streamerId,
      scoreDate,
    );

    // 2. Só validar limite para pontos positivos
    if (scoreData.points > 0) {
      // Verificar se adicionar estes pontos ultrapassará o limite diário
      const currentDailyPoints = await this.getDailyPointsByStreamerAndDate(
        scoreData.streamerId,
        scoreDate,
      );

      const newTotal = currentDailyPoints + scoreData.points;
      if (newTotal > this.DAILY_POINTS_LIMIT) {
        const remainingPoints = this.DAILY_POINTS_LIMIT - currentDailyPoints;
        throw new BadRequestException(
          `Limite diário de ${this.DAILY_POINTS_LIMIT} pontos excedido. ` +
            `Pontos atuais do dia: ${currentDailyPoints}. ` +
            `Pontos restantes: ${Math.max(0, remainingPoints)}.`,
        );
      }
    }

    const createdScore = await this.prisma.score.create({
      data: {
        streamerId: scoreData.streamerId,
        date: scoreDate,
        hour: scoreData.hour,
        minute: scoreData.minute,
        points: scoreData.points,
      },
    });

    return this.toDomain(createdScore);
  }

  async findById(id: number): Promise<Score | null> {
    const score = await this.prisma.score.findUnique({
      where: { id },
    });

    return score ? this.toDomain(score) : null;
  }

  async findByStreamerId(streamerId: number): Promise<Score[]> {
    const scores = await this.prisma.score.findMany({
      where: { streamerId },
      orderBy: { date: 'desc' },
    });

    return scores.map((score) => this.toDomain(score));
  }

  async findAll(): Promise<Score[]> {
    const scores = await this.prisma.score.findMany({
      orderBy: { date: 'desc' },
    });

    return scores.map((score) => this.toDomain(score));
  }

  async delete(id: number): Promise<void> {
    await this.prisma.score.delete({
      where: { id },
    });
  }

  async getTotalPointsByStreamerId(streamerId: number): Promise<number> {
    const result = await this.prisma.score.aggregate({
      where: { streamerId },
      _sum: { points: true },
    });

    return result._sum.points || 0;
  }

  async getDailyPointsByStreamerAndDate(
    streamerId: number,
    date: Date,
  ): Promise<number> {
    // Criar o início e fim do dia (00:00:00 até 23:59:59)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.score.aggregate({
      where: {
        streamerId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        points: {
          gt: 0, // Só somar pontos positivos para o limite
        },
      },
      _sum: { points: true },
    });

    return result._sum.points || 0;
  }

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

    // Buscar todos os scores no período
    const scores = await this.prisma.score.findMany({
      where: {
        streamerId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calcular total de pontos
    const totalPoints = scores.reduce((sum, score) => sum + score.points, 0);

    return {
      streamerId,
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

  private toDomain(prismaScore: any): Score {
    return new Score(
      prismaScore.id,
      prismaScore.streamerId,
      prismaScore.points,
      prismaScore.date,
    );
  }

  async getWeeklyRanking(
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyRankingData[]> {
    // Buscar todos os scores da semana com informações do streamer
    const scores = await this.prisma.score.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        streamer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Agrupar por streamer
    const streamerMap = new Map<
      number,
      {
        streamerId: number;
        nickname: string;
        totalPoints: number;
        dailyPoints: { [day: string]: number };
      }
    >();

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    scores.forEach((score) => {
      const streamerId = score.streamerId;
      const dayOfWeek = dayNames[score.date.getDay()];

      if (!streamerMap.has(streamerId)) {
        streamerMap.set(streamerId, {
          streamerId,
          nickname: score.streamer.user.nickname,
          totalPoints: 0,
          dailyPoints: {},
        });
      }

      const streamerData = streamerMap.get(streamerId)!;
      streamerData.totalPoints += score.points;

      if (!streamerData.dailyPoints[dayOfWeek]) {
        streamerData.dailyPoints[dayOfWeek] = 0;
      }
      streamerData.dailyPoints[dayOfWeek] += score.points;
    });

    // Converter para array e calcular médias
    const rankingData = Array.from(streamerMap.values()).map((streamer) => {
      const daysWithPoints = Object.keys(streamer.dailyPoints).length;
      const averagePoints =
        daysWithPoints > 0 ? streamer.totalPoints / daysWithPoints : 0;

      return {
        ...streamer,
        averagePoints: Math.round(averagePoints * 100) / 100, // Arredondar para 2 casas decimais
        position: 0, // Será definido após ordenação
      };
    });

    // Ordenar por total de pontos (decrescente) e definir posições
    rankingData.sort((a, b) => b.totalPoints - a.totalPoints);
    rankingData.forEach((streamer, index) => {
      streamer.position = index + 1;
    });

    return rankingData;
  }

  async getWeeklyAverage(
    streamerId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyAverageData | null> {
    // Buscar o streamer
    const streamer = await this.prisma.streamer.findUnique({
      where: { id: streamerId },
      include: { user: true },
    });

    if (!streamer) {
      return null;
    }

    // Buscar todos os scores da semana para este streamer
    const scores = await this.prisma.score.findMany({
      where: {
        streamerId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dailyBreakdown: { [day: string]: number } = {};
    let totalPoints = 0;

    // Agrupar pontos por dia
    scores.forEach((score) => {
      const dayOfWeek = dayNames[score.date.getDay()];
      totalPoints += score.points;

      if (!dailyBreakdown[dayOfWeek]) {
        dailyBreakdown[dayOfWeek] = 0;
      }
      dailyBreakdown[dayOfWeek] += score.points;
    });

    const daysWithPoints = Object.keys(dailyBreakdown).length;
    const averagePoints = daysWithPoints > 0 ? totalPoints / daysWithPoints : 0;

    return {
      streamerId,
      nickname: streamer.user.nickname,
      totalPoints,
      daysWithPoints,
      averagePoints: Math.round(averagePoints * 100) / 100,
      dailyBreakdown,
    };
  }

  async getDailyScoresForWeek(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyScoreData[]> {
    // Buscar todos os scores da semana
    const scores = await this.prisma.score.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        streamer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Agrupar por data
    const dailyMap = new Map<
      string,
      {
        date: Date;
        dayOfWeek: string;
        streamers: Map<
          number,
          { streamerId: number; nickname: string; points: number }
        >;
      }
    >();

    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    scores.forEach((score) => {
      const dateKey = score.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayOfWeek = dayNames[score.date.getDay()];

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: score.date,
          dayOfWeek,
          streamers: new Map(),
        });
      }

      const dayData = dailyMap.get(dateKey)!;
      const streamerId = score.streamerId;

      if (!dayData.streamers.has(streamerId)) {
        dayData.streamers.set(streamerId, {
          streamerId,
          nickname: score.streamer.user.nickname,
          points: 0,
        });
      }

      dayData.streamers.get(streamerId)!.points += score.points;
    });

    // Converter para array final
    return Array.from(dailyMap.values()).map((dayData) => ({
      date: dayData.date,
      dayOfWeek: dayData.dayOfWeek,
      streamers: Array.from(dayData.streamers.values()).sort(
        (a, b) => b.points - a.points,
      ),
    }));
  }

  private async validateNoDuplicateInLastSixMinutes(
    streamerId: number,
    currentTime: Date,
  ): Promise<void> {
    // Calcular 6 minutos atrás
    const sixMinutesAgo = new Date(currentTime.getTime() - 6 * 60 * 1000);

    // Buscar scores criados nos últimos 6 minutos para este streamer
    const recentScores = await this.prisma.score.findMany({
      where: {
        streamerId,
        date: {
          gte: sixMinutesAgo,
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 1,
    });

    if (recentScores.length > 0) {
      const lastScore = recentScores[0];
      const timeDiff = currentTime.getTime() - lastScore.date.getTime();
      const minutesLeft = Math.ceil((6 * 60 * 1000 - timeDiff) / (60 * 1000));

      throw new BadRequestException(
        `Score duplicado detectado. Último score criado há ${Math.floor(
          timeDiff / (60 * 1000),
        )} minuto(s). ` +
          `Aguarde ${minutesLeft} minuto(s) antes de criar outro score.`,
      );
    }
  }
}
