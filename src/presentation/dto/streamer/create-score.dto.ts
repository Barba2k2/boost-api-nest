import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateScoreDto {
  @ApiProperty({
    example: 1,
    description: 'ID do streamer que receberá os pontos',
  })
  @IsNumber()
  @IsPositive()
  streamerId: number;

  @ApiProperty({
    example: 5,
    description: 'Quantidade de pontos (máximo 240 por dia)',
    minimum: 1,
    maximum: 240,
  })
  @IsNumber()
  @Min(1, { message: 'Pontos devem ser maior que zero' })
  points: number;

  @ApiProperty({
    example: 'Completou stream de 2 horas',
    description: 'Motivo da pontuação',
  })
  @IsString()
  reason: string;
}
