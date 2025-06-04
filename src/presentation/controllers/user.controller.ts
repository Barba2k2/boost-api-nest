import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserUseCase } from '@application/use-cases/user/create-user.use-case';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { UpdateUserTokensUseCase } from '@application/use-cases/user/update-user-tokens.use-case';
import { CreateUserDto } from '@presentation/dto/user/create-user.dto';
import { UpdateTokensDto } from '@presentation/dto/user/update-tokens.dto';
import { UserResponseDto } from '@presentation/dto/user/user-response.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserTokensUseCase: UpdateUserTokensUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Usuário já existe.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.createUserUseCase.execute({
      nickname: createUserDto.nickname,
      password: createUserDto.password,
      role: createUserDto.role,
    });

    return UserResponseDto.fromDomain(user);
  }

  @Get(':id')
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
