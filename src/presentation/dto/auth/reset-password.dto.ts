import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email ou nome de usuário (nickname)',
    example: 'joao@example.com',
  })
  @IsNotEmpty({ message: 'O email ou nickname é obrigatório' })
  @IsString({ message: 'O email ou nickname deve ser uma string' })
  emailOrNickname: string;

  @ApiProperty({
    description: 'Token de reset recebido após validação do PIN',
    example: 'abc123xyz789',
  })
  @IsNotEmpty({ message: 'O token de reset é obrigatório' })
  @IsString({ message: 'O token de reset deve ser uma string' })
  resetToken: string;

  @ApiProperty({
    description: 'Nova senha',
    example: 'NovaSenh@123',
  })
  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  @IsString({ message: 'A nova senha deve ser uma string' })
  @MinLength(8, { message: 'A nova senha deve ter pelo menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'A nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número ou caractere especial',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmação da nova senha',
    example: 'NovaSenh@123',
  })
  @IsNotEmpty({ message: 'A confirmação da senha é obrigatória' })
  @IsString({ message: 'A confirmação da senha deve ser uma string' })
  confirmPassword: string;
}
