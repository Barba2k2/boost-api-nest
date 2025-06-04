import { Score } from '@domain/entities/score.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ScoreResponseDto {
  @ApiProperty({ example: 1, description: 'ID do score' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID do streamer' })
  streamerId: number;

  @ApiProperty({ example: 5, description: 'Quantidade de pontos' })
  points: number;

  @ApiProperty({
    example: 'Completou stream de 2 horas',
    description: 'Motivo da pontuação',
  })
  reason: string;

  @ApiProperty({
    example: '2025-01-04T14:30:00Z',
    description: 'Data de criação',
  })
  createdAt: Date;

  constructor(
    id: number,
    streamerId: number,
    points: number,
    reason: string,
    createdAt: Date,
  ) {
    this.id = id;
    this.streamerId = streamerId;
    this.points = points;
    this.reason = reason;
    this.createdAt = createdAt;
  }

  static fromDomain(score: Score): ScoreResponseDto {
    return new ScoreResponseDto(
      score.id,
      score.streamerId,
      score.points,
      score.reason,
      score.createdAt || new Date(),
    );
  }
}
