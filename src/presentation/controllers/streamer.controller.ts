import { CreateStreamerUseCase } from '@application/use-cases/streamer/create-streamer.use-case';
import { GetAllStreamersUseCase } from '@application/use-cases/streamer/get-all-streamers.use-case';
import { UpdateStreamerUseCase } from '@application/use-cases/streamer/update-streamer.use-case';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateStreamerDto } from '@presentation/dto/streamer/create-streamer.dto';
import { StreamerResponseDto } from '@presentation/dto/streamer/streamer-response.dto';

@ApiTags('streamers')
@Controller('streamers')
export class StreamerController {
  constructor(
    private readonly createStreamerUseCase: CreateStreamerUseCase,
    private readonly getAllStreamersUseCase: GetAllStreamersUseCase,
    private readonly updateStreamerUseCase: UpdateStreamerUseCase,
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
}
