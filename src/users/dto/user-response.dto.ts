import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'ID do usuário', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Nome de usuário (nickname)',
    example: 'johndoe',
  })
  nickname: string;

  @ApiProperty({ description: 'Função do usuário', example: 'user' })
  role: string;

  @ApiProperty({
    description: 'ID do streamer (se existir)',
    example: 1,
    nullable: true,
  })
  streamerId: number | null;
}
