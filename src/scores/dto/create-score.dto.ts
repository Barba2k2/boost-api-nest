import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateScoreDto {
  @ApiProperty({ description: 'ID do streamer', example: 1 })
  @IsNotEmpty({ message: 'O ID do streamer é obrigatório' })
  @IsNumber({}, { message: 'O ID do streamer deve ser um número' })
  streamerId: number;

  @ApiProperty({ description: 'Data da pontuação', example: '2025-05-20' })
  @IsNotEmpty({ message: 'A data é obrigatória' })
  @IsDateString({}, { message: 'A data deve estar no formato ISO 8601' })
  date: Date;

  @ApiProperty({ description: 'Hora da pontuação', example: 18 })
  @IsNotEmpty({ message: 'A hora é obrigatória' })
  @IsInt({ message: 'A hora deve ser um número inteiro' })
  @Min(0, { message: 'A hora deve ser maior ou igual a 0' })
  hour: number;

  @ApiProperty({
    description: 'Minuto da pontuação',
    example: 30,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'O minuto deve ser um número inteiro' })
  @Min(0, { message: 'O minuto deve ser maior ou igual a 0' })
  minute?: number;

  @ApiProperty({ description: 'Pontos', example: 100 })
  @IsNotEmpty({ message: 'Os pontos são obrigatórios' })
  @IsInt({ message: 'Os pontos devem ser um número inteiro' })
  @Min(0, { message: 'Os pontos devem ser maiores ou iguais a 0' })
  points: number;
}
