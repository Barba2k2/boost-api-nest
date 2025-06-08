import { CreateScoreUseCase } from '@application/use-cases/streamer/create-score.use-case';
import { GetDailyPointsUseCase } from '@application/use-cases/streamer/get-daily-points.use-case';
import { GetScoreReportUseCase } from '@application/use-cases/streamer/get-score-report.use-case';
import { GetScoresByHourUseCase } from '@application/use-cases/streamer/get-scores-by-hour.use-case';
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
import { ScoreReportResponseDto } from '@presentation/dto/streamer/score-report-response.dto';
import { ScoreResponseDto } from '@presentation/dto/streamer/score-response.dto';
import { ScoresByHourResponseDto } from '@presentation/dto/streamer/scores-by-hour-response.dto';
import { ScoreRateLimitInterceptor } from '../../infrastructure/cache/interceptors/score-rate-limit.interceptor';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('scores')
@Controller('scores')
export class ScoreController {
  constructor(
    private readonly createScoreUseCase: CreateScoreUseCase,
    private readonly getDailyPointsUseCase: GetDailyPointsUseCase,
    private readonly getScoreReportUseCase: GetScoreReportUseCase,
    private readonly getScoresByHourUseCase: GetScoresByHourUseCase,
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
    // Converter a data string para Date object
    const date = new Date(createScoreDto.date + 'T00:00:00.000Z');
    if (isNaN(date.getTime())) {
      throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
    }

    const score = await this.createScoreUseCase.execute({
      streamerId: createScoreDto.streamerId,
      date,
      hour: createScoreDto.hour,
      minute: createScoreDto.minute,
      points: createScoreDto.points,
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

  @Get('report/:streamerId')
  @ApiOperation({
    summary: '🔒 PRIVADO - Relatório de pontos por período',
    description:
      'Endpoint privado que gera relatório detalhado de pontos de um streamer em um período específico, incluindo nickname, datas e horários.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Data de início do período (formato: YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Data de fim do período (formato: YYYY-MM-DD)',
    example: '2025-01-07',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso.',
    type: ScoreReportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Streamer não encontrado.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou não fornecido.',
  })
  async getScoreReport(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<ScoreReportResponseDto> {
    // Validar e converter datas
    const startDate = new Date(startDateString + 'T00:00:00.000Z');
    const endDate = new Date(endDateString + 'T23:59:59.999Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
    }

    const result = await this.getScoreReportUseCase.execute({
      streamerId,
      startDate,
      endDate,
    });

    return ScoreReportResponseDto.fromDomain(result);
  }

  @Get('by-hour')
  @ApiOperation({
    summary:
      '🔒 PRIVADO - Pontos agrupados por hora para painel administrativo',
    description:
      'Endpoint privado que retorna pontos de todos os streamers agrupados por hora para uma data específica. Ideal para popular tabelas no painel administrativo.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description:
      'Data para consulta (formato: YYYY-MM-DD). Se não informado, usa a data atual.',
    example: '2025-01-07',
  })
  @ApiResponse({
    status: 200,
    description: 'Pontos por hora consultados com sucesso.',
    type: ScoresByHourResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Data inválida.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou não fornecido.',
  })
  async getScoresByHour(
    @Query('date') dateString?: string,
  ): Promise<ScoresByHourResponseDto> {
    let date: Date | undefined;

    if (dateString) {
      date = new Date(dateString + 'T00:00:00.000Z');
      if (isNaN(date.getTime())) {
        throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
      }
    }

    const result = await this.getScoresByHourUseCase.execute({ date });

    return ScoresByHourResponseDto.fromDomain(result);
  }
}
