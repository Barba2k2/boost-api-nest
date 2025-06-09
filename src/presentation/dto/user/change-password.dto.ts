import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'MinhaSenh@123',
  })
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  @IsString({ message: 'A senha atual deve ser uma string' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'NovaSenh@456',
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
    example: 'NovaSenh@456',
  })
  @IsNotEmpty({ message: 'A confirmação da senha é obrigatória' })
  @IsString({ message: 'A confirmação da senha deve ser uma string' })
  confirmPassword: string;
}
