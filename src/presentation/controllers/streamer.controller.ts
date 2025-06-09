import { GetAllStreamersUseCase } from '@application/use-cases/streamer/get-all-streamers.use-case';
import { GetOnlineStreamersUseCase } from '@application/use-cases/streamer/get-online-streamers.use-case';
import { UpdateMyStreamerUseCase } from '@application/use-cases/streamer/update-my-streamer.use-case';
import { UpdateStreamerOnlineStatusUseCase } from '@application/use-cases/streamer/update-streamer-online-status.use-case';
import { UpdateStreamerUseCase } from '@application/use-cases/streamer/update-streamer.use-case';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
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
import { StreamerResponseDto } from '@presentation/dto/streamer/streamer-response.dto';
import { UpdateMyStreamerDto } from '@presentation/dto/streamer/update-my-streamer.dto';
import { UpdateOnlineStatusDto } from '@presentation/dto/streamer/update-online-status.dto';
import { UpdateStreamerDto } from '@presentation/dto/streamer/update-streamer.dto';
import {
  CacheInterceptor,
  CacheResult,
} from '../../infrastructure/cache/interceptors/cache.interceptor';
import {
  RateLimit,
  RateLimitInterceptor,
} from '../../infrastructure/cache/interceptors/rate-limit.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('streamers')
@Controller('streamers')
export class StreamerController {
  constructor(
    private readonly getAllStreamersUseCase: GetAllStreamersUseCase,
    private readonly getOnlineStreamersUseCase: GetOnlineStreamersUseCase,
    private readonly updateStreamerUseCase: UpdateStreamerUseCase,
    private readonly updateStreamerOnlineStatusUseCase: UpdateStreamerOnlineStatusUseCase,
    private readonly updateMyStreamerUseCase: UpdateMyStreamerUseCase,
  ) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheResult('streamers:all', 1800) // Cache por 30 minutos
  @ApiOperation({ summary: 'Buscar todos os streamers' })
  @ApiResponse({
    status: 200,
    description: 'Lista de streamers.',
    type: [StreamerResponseDto],
  })
  async findAll(): Promise<StreamerResponseDto[]> {
    const streamers = await this.getAllStreamersUseCase.execute();
    return streamers.map((streamer) =>
      StreamerResponseDto.fromDomain(streamer),
    );
  }

  @Get('online')
  @UseInterceptors(CacheInterceptor)
  @CacheResult('streamers:online', 300) // Cache por 5 minutos
  @ApiOperation({ summary: 'Buscar streamers online' })
  @ApiResponse({
    status: 200,
    description: 'Lista de streamers online.',
    type: [StreamerResponseDto],
  })
  async findOnline(): Promise<StreamerResponseDto[]> {
    const streamers = await this.getOnlineStreamersUseCase.execute();
    return streamers.map((streamer) =>
      StreamerResponseDto.fromDomain(streamer),
    );
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ type: 'api' })
  @ApiOperation({ summary: '🎮 Editar meus dados de streamer' })
  @ApiResponse({
    status: 200,
    description: 'Dados de streamer atualizados com sucesso.',
    type: StreamerResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({
    status: 404,
    description: 'Perfil de streamer não encontrado.',
  })
  async updateMyStreamer(
    @Req() req: any,
    @Body() updateMyStreamerDto: UpdateMyStreamerDto,
  ): Promise<StreamerResponseDto> {
    const userId = req.user.sub;
    const streamer = await this.updateMyStreamerUseCase.execute({
      userId,
      platforms: updateMyStreamerDto.platforms,
      streamDays: updateMyStreamerDto.streamDays,
      startTime: updateMyStreamerDto.startTime,
      endTime: updateMyStreamerDto.endTime,
    });

    return StreamerResponseDto.fromDomain(streamer);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar streamer' })
  @ApiResponse({
    status: 200,
    description: 'Streamer atualizado com sucesso.',
    type: StreamerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Streamer não encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStreamerDto: UpdateStreamerDto,
  ): Promise<StreamerResponseDto> {
    const streamer = await this.updateStreamerUseCase.execute({
      id,
      nickname: updateStreamerDto.nickname,
      platforms: updateStreamerDto.platforms,
      streamDays: updateStreamerDto.streamDays,
      startTime: updateStreamerDto.startTime,
      endTime: updateStreamerDto.endTime,
    });

    return StreamerResponseDto.fromDomain(streamer);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Atualizar status online do streamer' })
  @ApiResponse({
    status: 200,
    description: 'Status online atualizado com sucesso.',
    type: StreamerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Streamer não encontrado.' })
  async updateOnlineStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOnlineStatusDto: UpdateOnlineStatusDto,
  ): Promise<StreamerResponseDto> {
    const streamer = await this.updateStreamerOnlineStatusUseCase.execute({
      streamerId: id,
      isOnline: updateOnlineStatusDto.isOnline,
    });

    return StreamerResponseDto.fromDomain(streamer);
  }
}
