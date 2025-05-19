import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ description: 'URL do streamer', example: 'johndoe' })
  @IsNotEmpty({ message: 'A URL do streamer é obrigatória' })
  @IsString({ message: 'A URL do streamer deve ser uma string' })
  streamerUrl: string;

  @ApiProperty({ description: 'Data do agendamento', example: '2025-05-20' })
  @IsNotEmpty({ message: 'A data é obrigatória' })
  @IsDateString({}, { message: 'A data deve estar no formato ISO 8601' })
  date: Date;

  @ApiProperty({ description: 'Hora de início', example: '18:00' })
  @IsNotEmpty({ message: 'A hora de início é obrigatória' })
  @IsString({ message: 'A hora de início deve ser uma string' })
  startTime: string;

  @ApiProperty({ description: 'Hora de término', example: '22:00' })
  @IsNotEmpty({ message: 'A hora de término é obrigatória' })
  @IsString({ message: 'A hora de término deve ser uma string' })
  endTime: string;
}
