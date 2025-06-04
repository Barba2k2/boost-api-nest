import { CreateScoreUseCase } from '@application/use-cases/streamer/create-score.use-case';
import { GetDailyPointsUseCase } from '@application/use-cases/streamer/get-daily-points.use-case';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateScoreDto } from '@presentation/dto/streamer/create-score.dto';
import { DailyPointsResponseDto } from '@presentation/dto/streamer/daily-points-response.dto';
import { ScoreResponseDto } from '@presentation/dto/streamer/score-response.dto';
import { ScoreRateLimitInterceptor } from '../../infrastructure/cache/interceptors/score-rate-limit.interceptor';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('scores')
@Controller('scores')
export class ScoreController {
  constructor(
    private readonly createScoreUseCase: CreateScoreUseCase,
    private readonly getDailyPointsUseCase: GetDailyPointsUseCase,
  ) {}

  @Post()
  @UseInterceptors(ScoreRateLimitInterceptor)
  @ApiOperation({
    summary: '🔒 PRIVADO - Criar um novo score para um streamer',
    description:
      'Endpoint privado que requer autenticação JWT. Usado pelo sistema interno para registrar pontuações dos streamers.',
  })
  @ApiResponse({
    status: 201,
    description: 'Score criado com sucesso.',
    type: ScoreResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Limite diário de 240 pontos excedido ou dados inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou não fornecido.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Limite de criação excedido. Máximo 1 score a cada 6 minutos por streamer.',
  })
  async create(
    @Body() createScoreDto: CreateScoreDto,
  ): Promise<ScoreResponseDto> {
    const score = await this.createScoreUseCase.execute({
      streamerId: createScoreDto.streamerId,
      points: createScoreDto.points,
      reason: createScoreDto.reason,
    });

    return ScoreResponseDto.fromDomain(score);
  }

  @Get('daily-points/:streamerId')
  @ApiOperation({
    summary: '🔒 PRIVADO - Consultar pontos diários de um streamer',
    description:
      'Endpoint privado que requer autenticação JWT. Usado pelo painel administrativo para visualizar dados detalhados.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description:
      'Data para consulta (formato: YYYY-MM-DD). Se não informado, usa a data atual.',
    example: '2025-01-04',
  })
  @ApiResponse({
    status: 200,
    description: 'Pontos diários consultados com sucesso.',
    type: DailyPointsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou não fornecido.',
  })
  async getDailyPoints(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('date') dateString?: string,
  ): Promise<DailyPointsResponseDto> {
    let date: Date | undefined;

    if (dateString) {
      date = new Date(dateString + 'T00:00:00.000Z');
      if (isNaN(date.getTime())) {
        throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
      }
    }

    const result = await this.getDailyPointsUseCase.execute({
      streamerId,
      date,
    });

    return DailyPointsResponseDto.fromDomain(result);
  }

  @Get('public/daily-points/:streamerId')
  @Public() // 🔓 Endpoint público
  @ApiOperation({
    summary: '🌐 PÚBLICO - Consultar pontos diários de um streamer',
    description:
      'Endpoint público acessível sem autenticação. Usado por widgets, páginas públicas e integrações externas para exibir pontuação dos streamers.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description:
      'Data para consulta (formato: YYYY-MM-DD). Se não informado, usa a data atual.',
    example: '2025-01-04',
  })
  @ApiResponse({
    status: 200,
    description: 'Pontos diários consultados com sucesso.',
    type: DailyPointsResponseDto,
  })
  async getPublicDailyPoints(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('date') dateString?: string,
  ): Promise<DailyPointsResponseDto> {
    let date: Date | undefined;

    if (dateString) {
      date = new Date(dateString + 'T00:00:00.000Z');
      if (isNaN(date.getTime())) {
        throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
      }
    }

    const result = await this.getDailyPointsUseCase.execute({
      streamerId,
      date,
    });

    return DailyPointsResponseDto.fromDomain(result);
  }
}
