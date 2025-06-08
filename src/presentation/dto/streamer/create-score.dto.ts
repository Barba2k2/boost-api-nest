import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsPositive, Max, Min } from 'class-validator';

export class CreateScoreDto {
  @ApiProperty({
    example: 1,
    description: 'ID do streamer que receberá os pontos',
  })
  @IsNumber()
  @IsPositive()
  streamerId: number;

  @ApiProperty({
    example: '2025-04-29',
    description: 'Data do score no formato YYYY-MM-DD',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 18,
    description: 'Hora do score (0-23)',
    minimum: 0,
    maximum: 23,
  })
  @IsNumber()
  @Min(0)
  @Max(23)
  hour: number;

  @ApiProperty({
    example: 50,
    description: 'Minuto do score (0-59)',
    minimum: 0,
    maximum: 59,
  })
  @IsNumber()
  @Min(0)
  @Max(59)
  minute: number;

  @ApiProperty({
    example: 1,
    description: 'Quantidade de pontos (máximo 240 por dia)',
    minimum: 1,
    maximum: 240,
  })
  @IsNumber()
  @Min(1, { message: 'Pontos devem ser maior que zero' })
  points: number;
}
