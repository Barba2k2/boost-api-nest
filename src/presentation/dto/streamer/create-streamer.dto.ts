import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStreamerDto {
  @ApiProperty({ example: 1, description: 'ID do usuário' })
  @IsNumber()
  userId: number;

  @ApiProperty({ example: 0, description: 'Pontos iniciais', required: false })
  @IsNumber()
  @IsOptional()
  points?: number;

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
}
