import { WeeklyRankingResult } from '@application/use-cases/streamer/get-weekly-ranking.use-case';
import { ApiProperty } from '@nestjs/swagger';

export class WeeklyRankingStreamerDto {
  @ApiProperty({ example: 1, description: 'ID do streamer' })
  streamerId: number;

  @ApiProperty({ example: 'aggeotv', description: 'Nickname do streamer' })
  nickname: string;

  @ApiProperty({ example: 750, description: 'Total de pontos na semana' })
  totalPoints: number;

  @ApiProperty({
    example: {
      monday: 120,
      tuesday: 150,
      wednesday: 100,
      thursday: 180,
      friday: 200,
    },
    description: 'Pontos por dia da semana',
  })
  dailyPoints: { [day: string]: number };

  @ApiProperty({ example: 150.0, description: 'Média de pontos por dia' })
  averagePoints: number;

  @ApiProperty({ example: 1, description: 'Posição no ranking' })
  position: number;
}

export class WeeklyRankingResponseDto {
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
    type: [WeeklyRankingStreamerDto],
    description: 'Ranking dos streamers na semana',
  })
  ranking: WeeklyRankingStreamerDto[];

  static fromDomain(result: WeeklyRankingResult): WeeklyRankingResponseDto {
    const dto = new WeeklyRankingResponseDto();

    dto.startDate = result.startDate;
    dto.endDate = result.endDate;
    dto.ranking = result.ranking.map((streamer) => ({
      streamerId: streamer.streamerId,
      nickname: streamer.nickname,
      totalPoints: streamer.totalPoints,
      dailyPoints: streamer.dailyPoints,
      averagePoints: streamer.averagePoints,
      position: streamer.position,
    }));

    return dto;
  }
}
