import { DailyScoresWeekResult } from '@application/use-cases/streamer/get-daily-scores-week.use-case';
import { ApiProperty } from '@nestjs/swagger';

export class DailyStreamerScoreDto {
  @ApiProperty({ example: 1, description: 'ID do streamer' })
  streamerId: number;

  @ApiProperty({ example: 'aggeotv', description: 'Nickname do streamer' })
  nickname: string;

  @ApiProperty({ example: 150, description: 'Pontos do dia' })
  points: number;
}

export class DailyScoreDto {
  @ApiProperty({
    example: '2025-01-06T00:00:00Z',
    description: 'Data do dia',
  })
  date: Date;

  @ApiProperty({ example: 'monday', description: 'Dia da semana' })
  dayOfWeek: string;

  @ApiProperty({
    type: [DailyStreamerScoreDto],
    description: 'Lista de streamers e seus pontos do dia',
  })
  streamers: DailyStreamerScoreDto[];
}

export class DailyScoresWeekResponseDto {
  @ApiProperty({
    example: '2025-01-06T00:00:00Z',
    description: 'Data de início da semana',
  })
  startDate: Date;

  @ApiProperty({
    example: '2025-01-12T23:59:59Z',
    description: 'Data de fim da semana',
  })
  endDate: Date;

  @ApiProperty({
    type: [DailyScoreDto],
    description: 'Pontos diários da semana',
  })
  dailyScores: DailyScoreDto[];

  static fromDomain(result: DailyScoresWeekResult): DailyScoresWeekResponseDto {
    const dto = new DailyScoresWeekResponseDto();

    dto.startDate = result.startDate;
    dto.endDate = result.endDate;
    dto.dailyScores = result.dailyScores.map((dailyScore) => ({
      date: dailyScore.date,
      dayOfWeek: dailyScore.dayOfWeek,
      streamers: dailyScore.streamers.map((streamer) => ({
        streamerId: streamer.streamerId,
        nickname: streamer.nickname,
        points: streamer.points,
      })),
    }));

    return dto;
  }
}
