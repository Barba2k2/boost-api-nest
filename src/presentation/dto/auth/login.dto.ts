import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Nome de usuário (nickname) do usuário',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: 'O nickname é obrigatório' })
  @IsString({ message: 'O nickname deve ser uma string' })
  nickname: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'Senha@123' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  password: string;
}
