import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ description: 'ID do streamer', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  streamerId: number;

  @ApiProperty({
    description: 'Status do streamer',
    example: 'ON',
    enum: ['ON', 'OFF'],
  })
  @IsString()
  @IsIn(['ON', 'OFF'], { message: 'Status deve ser ON ou OFF' })
  status: string;
}
