import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  STREAMER = 'streamer',
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome de usuário (nickname) do usuário',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: 'O nickname é obrigatório' })
  @IsString({ message: 'O nickname deve ser uma string' })
  @MinLength(3, { message: 'O nickname deve ter pelo menos 3 caracteres' })
  nickname: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'Senha@123' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  password: string;

  @ApiProperty({
    description: 'Função do usuário no sistema',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsNotEmpty({ message: 'A função é obrigatória' })
  @IsEnum(UserRole, {
    message: 'Função inválida, deve ser admin, user ou streamer',
  })
  role: UserRole;
}
