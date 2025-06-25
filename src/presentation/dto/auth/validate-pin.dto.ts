import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ValidatePinDto {
  @ApiProperty({
    description: 'Email ou nome de usuário (nickname)',
    example: 'joao@example.com',
  })
  @IsNotEmpty({ message: 'O email ou nickname é obrigatório' })
  @IsString({ message: 'O email ou nickname deve ser uma string' })
  emailOrNickname: string;

  @ApiProperty({
    description: 'PIN de 6 dígitos recebido por email',
    example: '123456',
  })
  @IsNotEmpty({ message: 'O PIN é obrigatório' })
  @IsString({ message: 'O PIN deve ser uma string' })
  @Length(6, 6, { message: 'O PIN deve ter exatamente 6 dígitos' })
  pin: string;
}
