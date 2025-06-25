import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email ou nome de usuário (nickname)',
    example: 'joao@example.com',
  })
  @IsNotEmpty({ message: 'O email ou nickname é obrigatório' })
  @IsString({ message: 'O email ou nickname deve ser uma string' })
  emailOrNickname: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'MinhaSenh@123' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  password: string;
}
