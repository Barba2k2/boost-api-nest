import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class SocialMediaDto {
  @ApiPropertyOptional({ description: 'Canal do Twitch' })
  @IsString()
  @IsOptional()
  twitchChannel?: string;

  @ApiPropertyOptional({ description: 'Canal do YouTube' })
  @IsString()
  @IsOptional()
  youtubeChannel?: string;

  @ApiPropertyOptional({ description: 'Perfil do Instagram' })
  @IsString()
  @IsOptional()
  instagramHandle?: string;

  @ApiPropertyOptional({ description: 'Perfil do TikTok' })
  @IsString()
  @IsOptional()
  tiktokHandle?: string;

  @ApiPropertyOptional({ description: 'Página do Facebook' })
  @IsString()
  @IsOptional()
  facebookPage?: string;
}

export class CreateStreamerDto {
  @ApiProperty({ description: 'ID do usuário', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({
    description: 'Pontos do streamer',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({
    description: 'Plataformas de streaming',
    example: ['Twitch', 'YouTube'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  platforms?: string[];

  @ApiPropertyOptional({
    description: 'Hora de início usual',
    example: '18:00',
  })
  @IsString()
  @IsOptional()
  usualStartTime?: string;

  @ApiPropertyOptional({
    description: 'Hora de término usual',
    example: '22:00',
  })
  @IsString()
  @IsOptional()
  usualEndTime?: string;

  @ApiPropertyOptional({
    description: 'Dias de stream',
    example: ['Segunda', 'Quarta', 'Sexta'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  streamDays?: string[];

  @ApiPropertyOptional({ description: 'Redes sociais do streamer' })
  @ValidateNested()
  @Type(() => SocialMediaDto)
  @IsOptional()
  socialMedia?: SocialMediaDto;
}
