import { LoginLogEntry } from '@application/use-cases/auth/get-login-logs.use-case';
import { ApiProperty } from '@nestjs/swagger';

export class LoginLogResponseDto {
  @ApiProperty({ example: 1, description: 'ID do usuário' })
  userId: number;

  @ApiProperty({ example: 'admin', description: 'Nickname do usuário' })
  nickname: string;

  @ApiProperty({ example: 'admin', description: 'Role do usuário' })
  role: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Data e hora do último login',
  })
  lastLogin: Date;

  static fromDomain(log: LoginLogEntry): LoginLogResponseDto {
    const dto = new LoginLogResponseDto();
    dto.userId = log.userId;
    dto.nickname = log.nickname;
    dto.role = log.role;
    dto.lastLogin = log.lastLogin;
    return dto;
  }
}

export class LoginLogsResponseDto {
  @ApiProperty({
    type: [LoginLogResponseDto],
    description: 'Lista de logs de login',
  })
  logs: LoginLogResponseDto[];

  @ApiProperty({ example: 150, description: 'Total de logs disponíveis' })
  total: number;

  @ApiProperty({ example: 50, description: 'Limite aplicado na consulta' })
  limit: number;

  @ApiProperty({ example: 0, description: 'Offset aplicado na consulta' })
  offset: number;

  static fromDomain(
    result: { logs: LoginLogEntry[]; total: number },
    limit: number,
    offset: number,
  ): LoginLogsResponseDto {
    const dto = new LoginLogsResponseDto();
    dto.logs = result.logs.map((log) => LoginLogResponseDto.fromDomain(log));
    dto.total = result.total;
    dto.limit = limit;
    dto.offset = offset;
    return dto;
  }
}
