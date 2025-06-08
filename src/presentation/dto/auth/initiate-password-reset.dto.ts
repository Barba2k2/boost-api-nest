import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InitiatePasswordResetDto {
  @ApiProperty({
    description: 'Email ou nome de usuário (nickname) para recuperação',
    example: 'joao@example.com',
  })
  @IsNotEmpty({ message: 'O email ou nickname é obrigatório' })
  @IsString({ message: 'O email ou nickname deve ser uma string' })
  emailOrNickname: string;
}
