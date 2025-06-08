import { GenerateTokensUseCase } from '@application/use-cases/auth/generate-tokens.use-case';
import { GetLoginLogsUseCase } from '@application/use-cases/auth/get-login-logs.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { RegisterUserUseCase } from '@application/use-cases/auth/register-user.use-case';
import { ValidateUserUseCase } from '@application/use-cases/auth/validate-user.use-case';
import { UpdateLastLoginUseCase } from '@application/use-cases/user/update-last-login.use-case';
import { UpdateUserTokensUseCase } from '@application/use-cases/user/update-user-tokens.use-case';
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
import { ConfirmLoginDto } from '@presentation/dto/auth/confirm-login.dto';
import { LoginLogsResponseDto } from '@presentation/dto/auth/login-logs-response.dto';
import { LoginDto } from '@presentation/dto/auth/login.dto';
import { RefreshTokenDto } from '@presentation/dto/auth/refresh-token.dto';
import { RegisterDto } from '@presentation/dto/auth/register.dto';
import { TokenResponseDto } from '@presentation/dto/auth/token-response.dto';
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
    private readonly updateUserTokensUseCase: UpdateUserTokensUseCase,
    private readonly updateLastLoginUseCase: UpdateLastLoginUseCase,
    private readonly getLoginLogsUseCase: GetLoginLogsUseCase,
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
      includeRefreshToken: false,
    });

    return {
      access_token: tokens.access_token,
    };
  }

  @Post('confirm-login/:id')
  @Public()
  @ApiOperation({ summary: 'Confirmar login e obter tokens completos' })
  @ApiResponse({
    status: 200,
    description: 'Login confirmado com sucesso.',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Usuário não encontrado.' })
  async confirmLogin(
    @Param('id', ParseIntPipe) userId: number,
    @Body() confirmLoginDto: ConfirmLoginDto,
  ): Promise<TokenResponseDto> {
    // TODO: Implementar caso de uso específico para confirmLogin
    // Por enquanto, retornando tokens simples

    // Atualizar tokens do usuário
    await this.updateUserTokensUseCase.execute(userId, {
      webToken: confirmLoginDto.web_token,
      windowsToken: confirmLoginDto.windows_token,
    });

    // Retornar tokens simples por enquanto
    return {
      access_token: `Bearer token-placeholder`,
      refresh_token: `Bearer refresh-token-placeholder`,
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
}
