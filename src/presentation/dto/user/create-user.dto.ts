import { UserRole } from '@domain/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'joaosilva', description: 'Nickname do usuário' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'hashedpassword123',
    description: 'Senha hasheada do usuário',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Papel do usuário no sistema',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
