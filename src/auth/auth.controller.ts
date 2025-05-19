import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Req,
  Patch,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfirmLoginDto } from './dto/confirm-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou usuário já existente.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso.',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() loginDto: LoginDto, @Req() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('confirm')
  @ApiOperation({ summary: 'Confirmar login e receber refresh token' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Login confirmado com sucesso.',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async confirmLogin(@Req() req, @Body() confirmLoginDto: ConfirmLoginDto) {
    return this.authService.confirmLogin(
      req.user.userId as number,
      confirmLoginDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('refresh')
  @ApiOperation({ summary: 'Atualizar token de acesso' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Token atualizado com sucesso.',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  async refreshToken(@Req() req, @Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(
      req.user.userId as number,
      refreshTokenDto,
    );
  }
}
