import { Streamer } from '@domain/entities/streamer.entity';

export const STREAMER_REPOSITORY_TOKEN = Symbol('IStreamerRepository');

export interface CreateStreamerData {
  userId: number;
  points?: number;
  platforms?: string[];
  streamDays?: string[];
}

export interface UpdateStreamerData {
  points?: number;
  platforms?: string[];
  streamDays?: string[];
  isOnline?: boolean;
}

export interface IStreamerRepository {
  create(streamerData: CreateStreamerData): Promise<Streamer>;
  findById(id: number): Promise<Streamer | null>;
  findByUserId(userId: number): Promise<Streamer | null>;
  findAll(): Promise<Streamer[]>;
  update(id: number, data: UpdateStreamerData): Promise<Streamer>;
  delete(id: number): Promise<void>;
  addPoints(id: number, points: number): Promise<Streamer>;
  updateOnlineStatus(id: number, isOnline: boolean): Promise<Streamer>;
  findOnlineStreamers(): Promise<Streamer[]>;
}
