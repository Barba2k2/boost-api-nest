import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateStreamerDto {
  @ApiProperty({
    example: 'meu_nick_twitch',
    description: 'Nick do streamer na plataforma',
    required: false,
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    example: ['twitch', 'youtube'],
    description: 'Plataformas de streaming',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  platforms?: string[];

  @ApiProperty({
    example: ['monday', 'wednesday', 'friday'],
    description: 'Dias da semana que faz stream',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  streamDays?: string[];

  @ApiProperty({
    example: '20:00',
    description: 'Horário de início das streams (formato HH:mm)',
    required: false,
  })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({
    example: '00:00',
    description: 'Horário de fim das streams (formato HH:mm)',
    required: false,
  })
  @IsString()
  @IsOptional()
  endTime?: string;
}
