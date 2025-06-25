import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O nome completo deve ser uma string' })
  @MinLength(2, { message: 'O nome completo deve ter pelo menos 2 caracteres' })
  @MaxLength(100, {
    message: 'O nome completo deve ter no máximo 100 caracteres',
  })
  fullName?: string;

  @ApiProperty({
    description: 'Nickname do usuário',
    example: 'joaosilva123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O nickname deve ser uma string' })
  @MinLength(3, { message: 'O nickname deve ter pelo menos 3 caracteres' })
  @MaxLength(30, { message: 'O nickname deve ter no máximo 30 caracteres' })
  nickname?: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@email.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({
    description: 'Telefone do usuário',
    example: '+55 11 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 caracteres' })
  phone?: string;
}
