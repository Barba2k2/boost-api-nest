import { Score } from '@domain/entities/score.entity';

export interface CreateScoreData {
  streamerId: number;
  points: number;
  reason: string;
}

export interface IScoreRepository {
  create(scoreData: CreateScoreData): Promise<Score>;
  findById(id: number): Promise<Score | null>;
  findByStreamerId(streamerId: number): Promise<Score[]>;
  findAll(): Promise<Score[]>;
  delete(id: number): Promise<void>;
  getTotalPointsByStreamerId(streamerId: number): Promise<number>;
}
