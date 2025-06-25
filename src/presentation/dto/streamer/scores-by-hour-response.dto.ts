import { ScoresByHourResult } from '@application/use-cases/streamer/get-scores-by-hour.use-case';
import { ApiProperty } from '@nestjs/swagger';

export class StreamerScoresByHourDto {
  @ApiProperty({ example: 1, description: 'ID do streamer' })
  streamerId: number;

  @ApiProperty({ example: 'barba_09a', description: 'Nickname do streamer' })
  nickname: string;

  @ApiProperty({
    example: { '1h': 10, '2h': 15, '3h': 5 },
    description: 'Pontos agrupados por hora',
  })
  pointsByHour: { [hour: string]: number };
}

export class ScoresByHourResponseDto {
  @ApiProperty({
    example: '2025-01-07T00:00:00Z',
    description: 'Data consultada',
  })
  date: Date;

  @ApiProperty({
    type: [StreamerScoresByHourDto],
    description: 'Lista de streamers com pontos por hora',
  })
  streamers: StreamerScoresByHourDto[];

  static fromDomain(result: ScoresByHourResult): ScoresByHourResponseDto {
    const dto = new ScoresByHourResponseDto();

    dto.date = result.date;
    dto.streamers = result.streamers.map((streamer) => ({
      streamerId: streamer.streamerId,
      nickname: streamer.nickname,
      pointsByHour: streamer.pointsByHour,
    }));

    return dto;
  }
}
