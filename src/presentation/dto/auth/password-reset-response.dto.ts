import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetInitiatedResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem informativa sobre o resultado',
    example:
      'Se o usuário existir, um PIN de recuperação foi enviado para o email cadastrado.',
  })
  message: string;
}

export class PinValidationResponseDto {
  @ApiProperty({
    description: 'Indica se o PIN é válido',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Token de reset para completar a alteração de senha',
    example: 'abc123xyz789def456ghi',
    required: false,
  })
  token?: string;

  @ApiProperty({
    description: 'Mensagem informativa sobre o resultado',
    example:
      'PIN validado com sucesso. Você pode agora definir uma nova senha.',
  })
  message: string;
}

export class PasswordResetCompletedResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem informativa sobre o resultado',
    example:
      'Senha alterada com sucesso. Você pode fazer login com a nova senha.',
  })
  message: string;
}
