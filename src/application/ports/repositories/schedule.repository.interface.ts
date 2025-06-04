import { Schedule } from '@domain/entities/schedule.entity';

export interface CreateScheduleData {
  streamerId: number;
  day: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface UpdateScheduleData {
  day?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface IScheduleRepository {
  create(scheduleData: CreateScheduleData): Promise<Schedule>;
  findById(id: number): Promise<Schedule | null>;
  findByStreamerId(streamerId: number): Promise<Schedule[]>;
  findAll(): Promise<Schedule[]>;
  update(id: number, data: UpdateScheduleData): Promise<Schedule>;
  delete(id: number): Promise<void>;
  findConflictingSchedules(
    streamerId: number,
    day: string,
    startTime: string,
    endTime: string,
  ): Promise<Schedule[]>;
}
