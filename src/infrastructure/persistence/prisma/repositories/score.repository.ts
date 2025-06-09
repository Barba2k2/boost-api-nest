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
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ScoreReportRepository } from './score-report.repository';
import { ScoreValidationRepository } from './score-validation.repository';

@Injectable()
export class ScoreRepository implements IScoreRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoreValidationRepository: ScoreValidationRepository,
    private readonly scoreReportRepository: ScoreReportRepository,
  ) {}

  async create(scoreData: CreateScoreData): Promise<Score> {
    const scoreDate = new Date(scoreData.date);

    // Usar o repositório de validação para todas as validações
    await this.scoreValidationRepository.validateScoreCreation(
      scoreData.streamerId,
      scoreDate,
      scoreData.hour,
      scoreData.points,
    );

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

  // Delegar para o repositório de validação
  async getDailyPointsByStreamerAndDate(
    streamerId: number,
    date: Date,
  ): Promise<number> {
    return this.scoreValidationRepository.getDailyPointsByStreamerAndDate(
      streamerId,
      date,
    );
  }

  // Delegar para o repositório de relatórios
  async getScoreReportByPeriod(
    streamerId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ScoreReportData | null> {
    return this.scoreReportRepository.getScoreReportByPeriod(
      streamerId,
      startDate,
      endDate,
    );
  }

  async getScoresByDateGroupedByHour(date: Date): Promise<ScoreByHourData[]> {
    return this.scoreReportRepository.getScoresByDateGroupedByHour(date);
  }

  async getWeeklyRanking(
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyRankingData[]> {
    return this.scoreReportRepository.getWeeklyRanking(startDate, endDate);
  }

  async getWeeklyAverage(
    streamerId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyAverageData | null> {
    return this.scoreReportRepository.getWeeklyAverage(
      streamerId,
      startDate,
      endDate,
    );
  }

  async getDailyScoresForWeek(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyScoreData[]> {
    return this.scoreReportRepository.getDailyScoresForWeek(startDate, endDate);
  }

  private toDomain(prismaScore: any): Score {
    return new Score(
      prismaScore.id,
      prismaScore.streamerId,
      prismaScore.points,
      prismaScore.createdAt,
    );
  }
}
