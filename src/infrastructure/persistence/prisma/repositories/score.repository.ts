import {
  CreateScoreData,
  IScoreRepository,
} from '@application/ports/repositories/score.repository.interface';
import { Score } from '@domain/entities/score.entity';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ScoreRepository implements IScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(scoreData: CreateScoreData): Promise<Score> {
    const now = new Date();
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

  private toDomain(prismaScore: any, reason: string): Score {
    return new Score(
      prismaScore.id,
      prismaScore.streamerId,
      prismaScore.points,
      reason, // O schema atual não tem campo reason
      prismaScore.date,
    );
  }
}
