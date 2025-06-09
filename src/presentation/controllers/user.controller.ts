import { ChangePasswordUseCase } from '@application/use-cases/user/change-password.use-case';
import { CreateUserUseCase } from '@application/use-cases/user/create-user.use-case';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { UpdateProfileUseCase } from '@application/use-cases/user/update-profile.use-case';
import { UpdateUserTokensUseCase } from '@application/use-cases/user/update-user-tokens.use-case';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChangePasswordDto } from '@presentation/dto/user/change-password.dto';
import { CreateUserDto } from '@presentation/dto/user/create-user.dto';
import { UpdateProfileDto } from '@presentation/dto/user/update-profile.dto';
import { UpdateTokensDto } from '@presentation/dto/user/update-tokens.dto';
import { UserResponseDto } from '@presentation/dto/user/user-response.dto';
import {
  CacheInterceptor,
  CacheResult,
} from '../../infrastructure/cache/interceptors/cache.interceptor';
import {
  RateLimit,
  RateLimitInterceptor,
} from '../../infrastructure/cache/interceptors/rate-limit.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserTokensUseCase: UpdateUserTokensUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'create' })
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Usuário já existe.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute({
      fullName: createUserDto.fullName,
      nickname: createUserDto.nickname,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
    });

    return UserResponseDto.fromDomain(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(CacheInterceptor)
  @CacheResult('user:me', 1800) // Cache por 30 minutos
  @ApiOperation({ summary: '👤 Ver meu perfil' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário autenticado.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  async getMyProfile(@Req() req: any): Promise<UserResponseDto> {
    const userId = req.user.sub;
    const user = await this.getUserByIdUseCase.execute(userId);
    return UserResponseDto.fromDomain(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'api' })
  @ApiOperation({ summary: '✏️ Editar meu perfil' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({ status: 409, description: 'Nickname ou email já em uso.' })
  async updateMyProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const userId = req.user.sub;
    const user = await this.updateProfileUseCase.execute({
      userId,
      fullName: updateProfileDto.fullName,
      nickname: updateProfileDto.nickname,
      email: updateProfileDto.email,
      phone: updateProfileDto.phone,
    });

    return UserResponseDto.fromDomain(user);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'api' })
  @ApiOperation({ summary: '🔒 Alterar minha senha' })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado ou senha atual incorreta.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async changeMyPassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<UserResponseDto> {
    const userId = req.user.sub;
    const user = await this.changePasswordUseCase.execute({
      userId,
      currentPassword: changePasswordDto.currentPassword,
      newPassword: changePasswordDto.newPassword,
      confirmPassword: changePasswordDto.confirmPassword,
    });

    return UserResponseDto.fromDomain(user);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheResult('user', 3600) // Cache por 1 hora
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.getUserByIdUseCase.execute(id);
    return UserResponseDto.fromDomain(user);
  }

  @Patch(':id/tokens')
  @ApiOperation({ summary: 'Atualizar tokens do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Tokens atualizados com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async updateTokens(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTokensDto: UpdateTokensDto,
  ): Promise<UserResponseDto> {
    const user = await this.updateUserTokensUseCase.execute(
      id,
      updateTokensDto,
    );
    return UserResponseDto.fromDomain(user);
  }
}
