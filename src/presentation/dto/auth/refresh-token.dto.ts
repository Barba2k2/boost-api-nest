import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de atualização para obter um novo token de acesso',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: 'O refresh token é obrigatório' })
  @IsString({ message: 'O refresh token deve ser uma string' })
  refresh_token: string;
}
