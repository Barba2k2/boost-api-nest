import { DailyPointsResult } from '@application/use-cases/streamer/get-daily-points.use-case';
import { ApiProperty } from '@nestjs/swagger';

export class DailyPointsResponseDto {
  @ApiProperty({ example: 1, description: 'ID do streamer' })
  streamerId: number;

  @ApiProperty({
    example: '2025-01-04T00:00:00Z',
    description: 'Data consultada',
  })
  date: Date;

  @ApiProperty({ example: 120, description: 'Pontos acumulados no dia' })
  currentPoints: number;

  @ApiProperty({ example: 120, description: 'Pontos restantes no dia' })
  remainingPoints: number;

  @ApiProperty({ example: 240, description: 'Limite diário de pontos' })
  dailyLimit: number;

  constructor(
    streamerId: number,
    date: Date,
    currentPoints: number,
    remainingPoints: number,
    dailyLimit: number,
  ) {
    this.streamerId = streamerId;
    this.date = date;
    this.currentPoints = currentPoints;
    this.remainingPoints = remainingPoints;
    this.dailyLimit = dailyLimit;
  }

  static fromDomain(result: DailyPointsResult): DailyPointsResponseDto {
    return new DailyPointsResponseDto(
      result.streamerId,
      result.date,
      result.currentPoints,
      result.remainingPoints,
      result.dailyLimit,
    );
  }
}
