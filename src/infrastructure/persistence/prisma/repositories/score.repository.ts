import {
  CreateScoreData,
  IScoreRepository,
} from '@application/ports/repositories/score.repository.interface';
import { Score } from '@domain/entities/score.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ScoreRepository implements IScoreRepository {
  private readonly DAILY_POINTS_LIMIT = 240;

  constructor(private readonly prisma: PrismaService) {}

  async create(scoreData: CreateScoreData): Promise<Score> {
    const now = new Date();

    // 1. Verificar se já existe score nos últimos 6 minutos para este streamer
    await this.validateNoDuplicateInLastSixMinutes(scoreData.streamerId, now);

    // 2. Só validar limite para pontos positivos
    if (scoreData.points > 0) {
      // Verificar se adicionar estes pontos ultrapassará o limite diário
      const currentDailyPoints = await this.getDailyPointsByStreamerAndDate(
        scoreData.streamerId,
        now,
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
        date: now,
        hour: now.getHours(),
        minute: now.getMinutes(),
        points: scoreData.points,
      },
    });

    return this.toDomain(createdScore, scoreData.reason);
  }

  async findById(id: number): Promise<Score | null> {
    const score = await this.prisma.score.findUnique({
      where: { id },
    });

    return score ? this.toDomain(score, 'Score record') : null;
  }

  async findByStreamerId(streamerId: number): Promise<Score[]> {
    const scores = await this.prisma.score.findMany({
      where: { streamerId },
      orderBy: { date: 'desc' },
    });

    return scores.map((score) => this.toDomain(score, 'Score record'));
  }

  async findAll(): Promise<Score[]> {
    const scores = await this.prisma.score.findMany({
      orderBy: { date: 'desc' },
    });

    return scores.map((score) => this.toDomain(score, 'Score record'));
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

  private toDomain(prismaScore: any, reason: string): Score {
    return new Score(
      prismaScore.id,
      prismaScore.streamerId,
      prismaScore.points,
      reason, // O schema atual não tem campo reason
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
