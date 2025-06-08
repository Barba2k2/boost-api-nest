import { User, UserRole } from '@domain/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID do usuário' })
  id: number;

  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  fullName: string;

  @ApiProperty({ example: 'joaosilva', description: 'Nickname do usuário' })
  nickname: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Email do usuário' })
  email: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Papel do usuário no sistema',
  })
  role: UserRole;

  @ApiProperty({
    example: '2023-01-01T12:00:00.000Z',
    description: 'Data e hora do último login',
    required: false,
  })
  lastLogin?: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Data de criação',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Data de atualização',
    required: false,
  })
  updatedAt?: Date;

  static fromDomain(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.fullName = user.fullName || '';
    dto.nickname = user.nickname;
    dto.email = user.email || '';
    dto.role = user.role;
    dto.lastLogin = user.lastLogin;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
