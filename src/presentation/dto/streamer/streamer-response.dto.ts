import { Streamer } from '@domain/entities/streamer.entity';
import { ApiProperty } from '@nestjs/swagger';

export class StreamerResponseDto {
  @ApiProperty({ example: 1, description: 'ID do streamer' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID do usuário' })
  userId: number;

  @ApiProperty({ example: 100, description: 'Pontos do streamer' })
  points: number;

  @ApiProperty({
    example: ['twitch', 'youtube'],
    description: 'Plataformas de streaming',
  })
  platforms: string[];

  @ApiProperty({
    example: ['monday', 'wednesday', 'friday'],
    description: 'Dias da semana que faz stream',
  })
  streamDays: string[];

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Data de criação',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Data de atualização',
    required: false,
  })
  updatedAt?: Date;

  static fromDomain(streamer: Streamer): StreamerResponseDto {
    const dto = new StreamerResponseDto();
    dto.id = streamer.id;
    dto.userId = streamer.userId;
    dto.points = streamer.points;
    dto.platforms = streamer.platforms;
    dto.streamDays = streamer.streamDays;
    dto.createdAt = streamer.createdAt;
    dto.updatedAt = streamer.updatedAt;
    return dto;
  }
}
