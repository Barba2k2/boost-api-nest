import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateMyStreamerDto {
  @ApiProperty({
    example: ['twitch', 'youtube'],
    description: 'Plataformas de streaming',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Plataformas deve ser um array' })
  @IsString({ each: true, message: 'Cada plataforma deve ser uma string' })
  platforms?: string[];

  @ApiProperty({
    example: ['monday', 'wednesday', 'friday'],
    description: 'Dias da semana que faz stream',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Dias de stream deve ser um array' })
  @IsString({ each: true, message: 'Cada dia deve ser uma string' })
  streamDays?: string[];

  @ApiProperty({
    example: '20:00',
    description: 'Horário de início das streams (formato HH:mm)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Horário de início deve ser uma string' })
  startTime?: string;

  @ApiProperty({
    example: '00:00',
    description: 'Horário de fim das streams (formato HH:mm)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Horário de fim deve ser uma string' })
  endTime?: string;
}
