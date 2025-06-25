import { WeeklyAverageResult } from '@application/use-cases/streamer/get-weekly-average.use-case';
import { ApiProperty } from '@nestjs/swagger';

export class WeeklyAverageResponseDto {
  @ApiProperty({ example: 1, description: 'ID do streamer' })
  streamerId: number;

  @ApiProperty({ example: 'aggeotv', description: 'Nickname do streamer' })
  nickname: string;

  @ApiProperty({ example: 750, description: 'Total de pontos na semana' })
  totalPoints: number;

  @ApiProperty({ example: 5, description: 'Número de dias com pontos' })
  daysWithPoints: number;

  @ApiProperty({ example: 150.0, description: 'Média de pontos por dia' })
  averagePoints: number;

  @ApiProperty({
    example: {
      monday: 120,
      tuesday: 150,
      wednesday: 100,
      thursday: 180,
      friday: 200,
    },
    description: 'Detalhamento dos pontos por dia da semana',
  })
  dailyBreakdown: { [day: string]: number };

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

  static fromDomain(result: WeeklyAverageResult): WeeklyAverageResponseDto {
    const dto = new WeeklyAverageResponseDto();

    dto.streamerId = result.streamerId;
    dto.nickname = result.nickname;
    dto.totalPoints = result.totalPoints;
    dto.daysWithPoints = result.daysWithPoints;
    dto.averagePoints = result.averagePoints;
    dto.dailyBreakdown = result.dailyBreakdown;
    dto.startDate = result.startDate;
    dto.endDate = result.endDate;

    return dto;
  }
}
