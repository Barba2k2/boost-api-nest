import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
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

class UserDataDto {
  @ApiPropertyOptional({ description: 'Nickname do usuário' })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({ description: 'Senha do usuário' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Função do usuário (admin, user, streamer)',
  })
  @IsEnum(['admin', 'user', 'streamer'])
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: 'Nome completo do usuário' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Email do usuário' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do usuário' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdateStreamerDto {
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

  @ApiPropertyOptional({ description: 'Dados do usuário associado' })
  @ValidateNested()
  @Type(() => UserDataDto)
  @IsOptional()
  userData?: UserDataDto;
}
