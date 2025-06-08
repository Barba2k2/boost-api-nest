import { CreateStreamerUseCase } from '@application/use-cases/streamer/create-streamer.use-case';
import { GetAllStreamersUseCase } from '@application/use-cases/streamer/get-all-streamers.use-case';
import { GetOnlineStreamersUseCase } from '@application/use-cases/streamer/get-online-streamers.use-case';
import { UpdateStreamerOnlineStatusUseCase } from '@application/use-cases/streamer/update-streamer-online-status.use-case';
import { UpdateStreamerUseCase } from '@application/use-cases/streamer/update-streamer.use-case';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateStreamerDto } from '@presentation/dto/streamer/create-streamer.dto';
import { StreamerResponseDto } from '@presentation/dto/streamer/streamer-response.dto';
import { UpdateOnlineStatusDto } from '@presentation/dto/streamer/update-online-status.dto';
import {
  CacheInterceptor,
  CacheResult,
} from '../../infrastructure/cache/interceptors/cache.interceptor';

@ApiTags('streamers')
@Controller('streamers')
export class StreamerController {
  constructor(
    private readonly createStreamerUseCase: CreateStreamerUseCase,
    private readonly getAllStreamersUseCase: GetAllStreamersUseCase,
    private readonly getOnlineStreamersUseCase: GetOnlineStreamersUseCase,
    private readonly updateStreamerUseCase: UpdateStreamerUseCase,
    private readonly updateStreamerOnlineStatusUseCase: UpdateStreamerOnlineStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo streamer' })
  @ApiResponse({
    status: 201,
    description: 'Streamer criado com sucesso.',
    type: StreamerResponseDto,
  })
  async create(
    @Body() createStreamerDto: CreateStreamerDto,
  ): Promise<StreamerResponseDto> {
    const streamer = await this.createStreamerUseCase.execute({
      userId: createStreamerDto.userId,
      points: createStreamerDto.points,
      platforms: createStreamerDto.platforms,
      streamDays: createStreamerDto.streamDays,
    });

    return StreamerResponseDto.fromDomain(streamer);
  }

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
    @Body() updateStreamerDto: Partial<CreateStreamerDto>,
  ): Promise<StreamerResponseDto> {
    const streamer = await this.updateStreamerUseCase.execute({
      id,
      points: updateStreamerDto.points,
      platforms: updateStreamerDto.platforms,
      streamDays: updateStreamerDto.streamDays,
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
