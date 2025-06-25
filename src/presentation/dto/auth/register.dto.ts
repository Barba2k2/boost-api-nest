import { UserRole } from '@domain/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  @IsNotEmpty({ message: 'O nome completo é obrigatório' })
  @IsString({ message: 'O nome completo deve ser uma string' })
  @MinLength(2, { message: 'O nome completo deve ter pelo menos 2 caracteres' })
  @MaxLength(100, {
    message: 'O nome completo deve ter no máximo 100 caracteres',
  })
  fullName: string;

  @ApiProperty({
    description: 'Nome de usuário (nickname) do usuário',
    example: 'joaosilva',
  })
  @IsNotEmpty({ message: 'O nickname é obrigatório' })
  @IsString({ message: 'O nickname deve ser uma string' })
  @MinLength(3, { message: 'O nickname deve ter pelo menos 3 caracteres' })
  @MaxLength(30, { message: 'O nickname deve ter no máximo 30 caracteres' })
  nickname: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'MinhaSenh@123' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número ou caractere especial',
  })
  password: string;

  @ApiProperty({
    description: 'Confirmação da senha',
    example: 'MinhaSenh@123',
  })
  @IsNotEmpty({ message: 'A confirmação da senha é obrigatória' })
  @IsString({ message: 'A confirmação da senha deve ser uma string' })
  confirmPassword: string;

  @ApiProperty({
    description: 'Função do usuário no sistema',
    enum: UserRole,
    example: UserRole.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Função inválida, deve ser admin, user ou assistant',
  })
  role?: UserRole = UserRole.USER;
}
