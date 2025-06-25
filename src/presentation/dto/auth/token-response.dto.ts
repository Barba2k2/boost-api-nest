import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token de atualização para obter um novo token de acesso',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  refresh_token?: string;
}
