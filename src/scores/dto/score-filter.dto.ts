import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScoreFilterDto {
  @ApiPropertyOptional({
    description: 'Nickname do streamer',
    example: 'johndoe',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: 'Data de início', example: '2025-05-01' })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Data de término',
    example: '2025-05-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Hora de início', example: 18 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  startHour?: number;

  @ApiPropertyOptional({ description: 'Hora de término', example: 22 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  endHour?: number;
}
