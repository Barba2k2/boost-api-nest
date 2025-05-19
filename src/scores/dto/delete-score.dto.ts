import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString, IsInt, Min } from 'class-validator';

export class DeleteScoreDto {
  @ApiProperty({ description: 'Data da pontuação', example: '2025-05-20' })
  @IsNotEmpty({ message: 'A data é obrigatória' })
  @IsDateString({}, { message: 'A data deve estar no formato ISO 8601' })
  date: Date;

  @ApiProperty({ description: 'Hora da pontuação', example: 18 })
  @IsNotEmpty({ message: 'A hora é obrigatória' })
  @IsInt({ message: 'A hora deve ser um número inteiro' })
  @Min(0, { message: 'A hora deve ser maior ou igual a 0' })
  hour: number;
}
