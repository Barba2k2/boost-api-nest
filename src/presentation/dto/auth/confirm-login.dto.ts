import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ConfirmLoginDto {
  @ApiProperty({
    description: 'Token para web',
    required: false,
    example: 'web-device-token-example',
  })
  @IsString()
  @IsOptional()
  web_token?: string;

  @ApiProperty({
    description: 'Token para Windows',
    required: false,
    example: 'windows-device-token-example',
  })
  @IsString()
  @IsOptional()
  windows_token?: string;
}
