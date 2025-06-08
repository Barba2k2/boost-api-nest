import {
  CreateScoreData,
  IScoreRepository,
  ScoreByHourData,
  ScoreReportData,
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
