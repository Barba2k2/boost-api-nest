import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateOnlineStatusDto {
  @ApiProperty({
    example: true,
    description: 'Status online do streamer (true = online, false = offline)',
  })
  @IsNotEmpty({ message: 'O status online é obrigatório' })
  @IsBoolean({ message: 'O status online deve ser um boolean' })
  isOnline: boolean;
}
