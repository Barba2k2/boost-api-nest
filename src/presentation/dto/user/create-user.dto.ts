import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@domain/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Nickname do usuário' })
  @IsString()
  @IsNotEmpty()
  nickname: string;

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
