import { GenerateTokensUseCase } from '@application/use-cases/auth/generate-tokens.use-case';
import { GetLoginLogsUseCase } from '@application/use-cases/auth/get-login-logs.use-case';
import { InitiatePasswordResetUseCase } from '@application/use-cases/auth/initiate-password-reset.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { ResetPasswordUseCase } from '@application/use-cases/auth/reset-password.use-case';
import { ValidatePasswordResetPinUseCase } from '@application/use-cases/auth/validate-password-reset-pin.use-case';
import { ValidateUserUseCase } from '@application/use-cases/auth/validate-user.use-case';
import { UpdateLastLoginUseCase } from '@application/use-cases/user/update-last-login.use-case';

import { UserRole } from '@domain/entities/user.entity';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InitiatePasswordResetDto } from '@presentation/dto/auth/initiate-password-reset.dto';
import { LoginLogsResponseDto } from '@presentation/dto/auth/login-logs-response.dto';
import { LoginDto } from '@presentation/dto/auth/login.dto';
import {
  PasswordResetCompletedResponseDto,
  PasswordResetInitiatedResponseDto,
  PinValidationResponseDto,
} from '@presentation/dto/auth/password-reset-response.dto';
import { RefreshTokenDto } from '@presentation/dto/auth/refresh-token.dto';
import { RegisterDto } from '@presentation/dto/auth/register.dto';
import { ResetPasswordDto } from '@presentation/dto/auth/reset-password.dto';
import { TokenResponseDto } from '@presentation/dto/auth/token-response.dto';
import { ValidatePinDto } from '@presentation/dto/auth/validate-pin.dto';
import { UserResponseDto } from '@presentation/dto/user/user-response.dto';
import {
  RateLimit,
  RateLimitInterceptor,
} from '../../infrastructure/cache/interceptors/rate-limit.interceptor';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly validateUserUseCase: ValidateUserUseCase,
    private readonly generateTokensUseCase: GenerateTokensUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly updateLastLoginUseCase: UpdateLastLoginUseCase,
    private readonly getLoginLogsUseCase: GetLoginLogsUseCase,
    private readonly initiatePasswordResetUseCase: InitiatePasswordResetUseCase,
    private readonly validatePasswordResetPinUseCase: ValidatePasswordResetPinUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post('register')
  @Public()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'create' })
  @ApiOperation({ summary: 'Registrar um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Usuário já existe.' })
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute({
      fullName: registerDto.fullName,
      nickname: registerDto.nickname,
      email: registerDto.email,
      password: registerDto.password,
      confirmPassword: registerDto.confirmPassword,
      role: registerDto.role,
    });

    return UserResponseDto.fromDomain(user);
  }

  @Post('login')
  @Public()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'login' })
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso.',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
  ): Promise<TokenResponseDto> {
    // Validar usuário
    const user = await this.validateUserUseCase.execute({
      emailOrNickname: loginDto.emailOrNickname,
      password: loginDto.password,
    });

    // Atualizar último login
    await this.updateLastLoginUseCase.execute(user.id);

    // Gerar tokens
    const tokens = await this.generateTokensUseCase.execute({
      user,
      includeRefreshToken: true,
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  @Post('refresh/:id')
  @Public()
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso.',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  async refreshToken(
    @Param('id', ParseIntPipe) userId: number,
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return await this.refreshTokenUseCase.execute({
      userId,
      refreshToken: refreshTokenDto.refresh_token,
    });
  }

  @Get('login-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obter logs de login (apenas admins)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de registros (padrão: 50)',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Número de registros para pular (padrão: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Logs de login obtidos com sucesso.',
    type: LoginLogsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas administradores podem acessar.',
  })
  async getLoginLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<LoginLogsResponseDto> {
    const parsedLimit = limit ? Number(limit) : 50;
    const parsedOffset = offset ? Number(offset) : 0;

    const result = await this.getLoginLogsUseCase.execute({
      limit: parsedLimit,
      offset: parsedOffset,
    });

    return LoginLogsResponseDto.fromDomain(result, parsedLimit, parsedOffset);
  }

  @Post('password-reset/initiate')
  @Public()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'login' })
  @ApiOperation({ summary: 'Iniciar recuperação de senha' })
  @ApiResponse({
    status: 200,
    description: 'Solicitação de recuperação processada.',
    type: PasswordResetInitiatedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async initiatePasswordReset(
    @Body() initiatePasswordResetDto: InitiatePasswordResetDto,
  ): Promise<PasswordResetInitiatedResponseDto> {
    return await this.initiatePasswordResetUseCase.execute({
      emailOrNickname: initiatePasswordResetDto.emailOrNickname,
    });
  }

  @Post('password-reset/validate-pin')
  @Public()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'login' })
  @ApiOperation({ summary: 'Validar PIN de recuperação de senha' })
  @ApiResponse({
    status: 200,
    description: 'PIN validado com sucesso.',
    type: PinValidationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'PIN inválido ou expirado.' })
  async validatePasswordResetPin(
    @Body() validatePinDto: ValidatePinDto,
  ): Promise<PinValidationResponseDto> {
    return await this.validatePasswordResetPinUseCase.execute({
      emailOrNickname: validatePinDto.emailOrNickname,
      pin: validatePinDto.pin,
    });
  }

  @Post('password-reset/complete')
  @Public()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'login' })
  @ApiOperation({ summary: 'Completar reset de senha' })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso.',
    type: PasswordResetCompletedResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido ou dados inválidos.',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordResetCompletedResponseDto> {
    return await this.resetPasswordUseCase.execute({
      emailOrNickname: resetPasswordDto.emailOrNickname,
      resetToken: resetPasswordDto.resetToken,
      newPassword: resetPasswordDto.newPassword,
      confirmPassword: resetPasswordDto.confirmPassword,
    });
  }
}
