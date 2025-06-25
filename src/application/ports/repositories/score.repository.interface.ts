import { Score } from '@domain/entities/score.entity';

export const SCORE_REPOSITORY_TOKEN = Symbol('IScoreRepository');

export interface CreateScoreData {
  streamerId: number;
  date: Date;
  hour: number;
  minute: number;
  points: number;
}

export interface ScoreReportData {
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

export interface ScoreByHourData {
  streamerId: number;
  nickname: string;
  pointsByHour: { [hour: string]: number }; // "1h": 10, "2h": 15, etc.
}

export interface WeeklyRankingData {
  streamerId: number;
  nickname: string;
  totalPoints: number;
  dailyPoints: { [day: string]: number }; // "monday": 50, "tuesday": 30, etc.
  averagePoints: number;
  position: number;
}

export interface WeeklyAverageData {
  streamerId: number;
  nickname: string;
  totalPoints: number;
  daysWithPoints: number;
  averagePoints: number;
  dailyBreakdown: { [day: string]: number };
}

export interface DailyScoreData {
  date: Date;
  dayOfWeek: string;
  streamers: Array<{
    streamerId: number;
    nickname: string;
    points: number;
  }>;
}

export interface IScoreRepository {
  create(scoreData: CreateScoreData): Promise<Score>;
  findById(id: number): Promise<Score | null>;
  findByStreamerId(streamerId: number): Promise<Score[]>;
  findAll(): Promise<Score[]>;
  delete(id: number): Promise<void>;
  getTotalPointsByStreamerId(streamerId: number): Promise<number>;
  getDailyPointsByStreamerAndDate(
    streamerId: number,
    date: Date,
  ): Promise<number>;
  getScoreReportByPeriod(
    streamerId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ScoreReportData | null>;
  getScoresByDateGroupedByHour(date: Date): Promise<ScoreByHourData[]>;
  getWeeklyRanking(
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyRankingData[]>;
  getWeeklyAverage(
    streamerId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyAverageData | null>;
  getDailyScoresForWeek(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyScoreData[]>;
}
