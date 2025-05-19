import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTokensDto {
  @ApiProperty({ description: 'Token de atualização', required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @ApiProperty({ description: 'Token para web', required: false })
  @IsString()
  @IsOptional()
  webToken?: string;

  @ApiProperty({ description: 'Token para Windows', required: false })
  @IsString()
  @IsOptional()
  windowsToken?: string;
}
