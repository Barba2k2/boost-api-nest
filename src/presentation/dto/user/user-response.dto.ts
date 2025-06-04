import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '@domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID do usuário' })
  id: number;

  @ApiProperty({ example: 'john_doe', description: 'Nickname do usuário' })
  nickname: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'Papel do usuário no sistema',
  })
  role: UserRole;

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
    dto.nickname = user.nickname;
    dto.role = user.role;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
