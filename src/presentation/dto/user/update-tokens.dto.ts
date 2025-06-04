import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTokensDto {
  @ApiProperty({
    example: 'refresh_token_example',
    description: 'Token de refresh',
    required: false,
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @ApiProperty({
    example: 'web_token_example',
    description: 'Token web',
    required: false,
  })
  @IsString()
  @IsOptional()
  webToken?: string;

  @ApiProperty({
    example: 'windows_token_example',
    description: 'Token Windows',
    required: false,
  })
  @IsString()
  @IsOptional()
  windowsToken?: string;
}
