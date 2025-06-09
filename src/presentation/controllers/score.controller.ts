import { CreateScoreUseCase } from '@application/use-cases/streamer/create-score.use-case';
import { GetDailyPointsUseCase } from '@application/use-cases/streamer/get-daily-points.use-case';
import { GetDailyScoresWeekUseCase } from '@application/use-cases/streamer/get-daily-scores-week.use-case';
import { GetReportByNicknameUseCase } from '@application/use-cases/streamer/get-report-by-nickname.use-case';
import { GetScoreReportUseCase } from '@application/use-cases/streamer/get-score-report.use-case';
import { GetScoresByHourUseCase } from '@application/use-cases/streamer/get-scores-by-hour.use-case';
import { GetWeeklyAverageUseCase } from '@application/use-cases/streamer/get-weekly-average.use-case';
import { GetWeeklyRankingUseCase } from '@application/use-cases/streamer/get-weekly-ranking.use-case';
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
import { DailyScoresWeekResponseDto } from '@presentation/dto/streamer/daily-scores-week-response.dto';
import { ScoreReportResponseDto } from '@presentation/dto/streamer/score-report-response.dto';
import { ScoreResponseDto } from '@presentation/dto/streamer/score-response.dto';
import { ScoresByHourResponseDto } from '@presentation/dto/streamer/scores-by-hour-response.dto';
import { WeeklyAverageResponseDto } from '@presentation/dto/streamer/weekly-average-response.dto';
import { WeeklyRankingResponseDto } from '@presentation/dto/streamer/weekly-ranking-response.dto';
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
    private readonly getWeeklyRankingUseCase: GetWeeklyRankingUseCase,
    private readonly getWeeklyAverageUseCase: GetWeeklyAverageUseCase,
    private readonly getDailyScoresWeekUseCase: GetDailyScoresWeekUseCase,
    private readonly getReportByNicknameUseCase: GetReportByNicknameUseCase,
  ) {}

  /**
   * Calcula as datas da semana atual (segunda a sábado)
   * Se for domingo, pega a semana anterior
   */
  private getCurrentWeekDates(): { startDate: Date; endDate: Date } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado

    // Se for domingo (0), voltar para a semana anterior
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Segunda-feira da semana
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);

    // Sábado da semana
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5); // +5 dias = sábado
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

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

  // ========== NOVOS ENDPOINTS PÚBLICOS ==========

  @Get('public/weekly-ranking')
  @Public() // 🔓 Endpoint público
  @ApiOperation({
    summary: '🌐 PÚBLICO - Ranking semanal de streamers',
    description:
      'Endpoint público que retorna o ranking de todos os streamers para uma semana específica (segunda a sábado). Se as datas não forem informadas, usa a semana atual.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Data de início da semana (formato: YYYY-MM-DD) - Segunda-feira. Se não informado, usa a semana atual.',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description:
      'Data de fim da semana (formato: YYYY-MM-DD) - Sábado. Se não informado, usa a semana atual.',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking semanal consultado com sucesso.',
    type: WeeklyRankingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  async getPublicWeeklyRanking(
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
  ): Promise<WeeklyRankingResponseDto> {
    let startDate: Date;
    let endDate: Date;

    // Se as datas não foram fornecidas, usar a semana atual
    if (!startDateString || !endDateString) {
      const currentWeek = this.getCurrentWeekDates();
      startDate = currentWeek.startDate;
      endDate = currentWeek.endDate;
    } else {
      // Validar e converter datas fornecidas
      startDate = new Date(startDateString + 'T00:00:00.000Z');
      endDate = new Date(endDateString + 'T23:59:59.999Z');

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
      }
    }

    const result = await this.getWeeklyRankingUseCase.execute({
      startDate,
      endDate,
    });

    return WeeklyRankingResponseDto.fromDomain(result);
  }

  @Get('public/weekly-average/:streamerId')
  @Public() // 🔓 Endpoint público
  @ApiOperation({
    summary: '🌐 PÚBLICO - Média semanal de um streamer',
    description:
      'Endpoint público que retorna a média completa da semana de um streamer específico, incluindo total de pontos, dias com pontos e detalhamento diário. Se as datas não forem informadas, usa a semana atual.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Data de início da semana (formato: YYYY-MM-DD) - Segunda-feira. Se não informado, usa a semana atual.',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description:
      'Data de fim da semana (formato: YYYY-MM-DD) - Sábado. Se não informado, usa a semana atual.',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Média semanal consultada com sucesso.',
    type: WeeklyAverageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Streamer não encontrado.',
  })
  async getPublicWeeklyAverage(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
  ): Promise<WeeklyAverageResponseDto> {
    let startDate: Date;
    let endDate: Date;

    // Se as datas não foram fornecidas, usar a semana atual
    if (!startDateString || !endDateString) {
      const currentWeek = this.getCurrentWeekDates();
      startDate = currentWeek.startDate;
      endDate = currentWeek.endDate;
    } else {
      // Validar e converter datas fornecidas
      startDate = new Date(startDateString + 'T00:00:00.000Z');
      endDate = new Date(endDateString + 'T23:59:59.999Z');

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
      }
    }

    const result = await this.getWeeklyAverageUseCase.execute({
      streamerId,
      startDate,
      endDate,
    });

    return WeeklyAverageResponseDto.fromDomain(result);
  }

  @Get('public/daily-week')
  @Public() // 🔓 Endpoint público
  @ApiOperation({
    summary: '🌐 PÚBLICO - Pontos diários da semana',
    description:
      'Endpoint público que retorna os pontos de todos os streamers agrupados por dia da semana (segunda a sábado). Ideal para gráficos e visualizações diárias. Se as datas não forem informadas, usa a semana atual.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Data de início da semana (formato: YYYY-MM-DD) - Segunda-feira. Se não informado, usa a semana atual.',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description:
      'Data de fim da semana (formato: YYYY-MM-DD) - Sábado. Se não informado, usa a semana atual.',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Pontos diários da semana consultados com sucesso.',
    type: DailyScoresWeekResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  async getPublicDailyWeek(
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
  ): Promise<DailyScoresWeekResponseDto> {
    let startDate: Date;
    let endDate: Date;

    // Se as datas não foram fornecidas, usar a semana atual
    if (!startDateString || !endDateString) {
      const currentWeek = this.getCurrentWeekDates();
      startDate = currentWeek.startDate;
      endDate = currentWeek.endDate;
    } else {
      // Validar e converter datas fornecidas
      startDate = new Date(startDateString + 'T00:00:00.000Z');
      endDate = new Date(endDateString + 'T23:59:59.999Z');

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
      }
    }

    const result = await this.getDailyScoresWeekUseCase.execute({
      startDate,
      endDate,
    });

    return DailyScoresWeekResponseDto.fromDomain(result);
  }

  @Get('public/report/:streamerId')
  @Public() // 🔓 Endpoint público
  @ApiOperation({
    summary: '🌐 PÚBLICO - Relatório de pontos por período',
    description:
      'Endpoint público que gera relatório detalhado de pontos de um streamer em um período específico. Versão pública do endpoint de relatório.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Data de início do período (formato: YYYY-MM-DD)',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Data de fim do período (formato: YYYY-MM-DD)',
    example: '2025-01-11',
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
  async getPublicScoreReport(
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

  @Get('public/report-by-nickname/:nickname')
  @Public() // 🔓 Endpoint público
  @ApiOperation({
    summary: '🌐 PÚBLICO - Relatório detalhado por nickname/canal',
    description:
      'Endpoint público que busca um streamer pelo nickname/canal e retorna relatório detalhado de pontos em um período específico com data e horário inicial/final.',
  })
  @ApiQuery({
    name: 'startDateTime',
    required: true,
    description: 'Data e hora de início (formato: YYYY-MM-DDTHH:mm:ss)',
    example: '2025-01-06T20:00:00',
  })
  @ApiQuery({
    name: 'endDateTime',
    required: true,
    description: 'Data e hora de fim (formato: YYYY-MM-DDTHH:mm:ss)',
    example: '2025-01-11T23:59:59',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório por nickname gerado com sucesso.',
    type: ScoreReportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Streamer com o nickname informado não encontrado.',
  })
  async getPublicReportByNickname(
    @Param('nickname') nickname: string,
    @Query('startDateTime') startDateTimeString: string,
    @Query('endDateTime') endDateTimeString: string,
  ): Promise<ScoreReportResponseDto> {
    // Validar e converter data/hora completa
    const startDateTime = new Date(startDateTimeString);
    const endDateTime = new Date(endDateTimeString);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw new Error(
        'Data/hora inválidas. Use o formato YYYY-MM-DDTHH:mm:ss.',
      );
    }

    const result = await this.getReportByNicknameUseCase.execute({
      nickname,
      startDate: startDateTime,
      endDate: endDateTime,
    });

    if (!result) {
      throw new Error(
        `Nenhum dado encontrado para o streamer '${nickname}' no período informado.`,
      );
    }

    return ScoreReportResponseDto.fromDomain(result);
  }

  // ========== ENDPOINTS ADMINISTRATIVOS PRIVADOS ==========

  @Get('admin/weekly-ranking')
  @ApiOperation({
    summary: '🔒 ADMIN - Ranking semanal para gestão administrativa',
    description:
      'Endpoint administrativo para visualizar ranking semanal com controle total de períodos. Usado pelo painel admin para análise histórica e gestão de períodos fechados.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description:
      'Data de início da semana (formato: YYYY-MM-DD) - Segunda-feira',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Data de fim da semana (formato: YYYY-MM-DD) - Sábado',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking administrativo consultado com sucesso.',
    type: WeeklyRankingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou não fornecido.',
  })
  async getAdminWeeklyRanking(
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<WeeklyRankingResponseDto> {
    // Validar e converter datas
    const startDate = new Date(startDateString + 'T00:00:00.000Z');
    const endDate = new Date(endDateString + 'T23:59:59.999Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
    }

    const result = await this.getWeeklyRankingUseCase.execute({
      startDate,
      endDate,
    });

    return WeeklyRankingResponseDto.fromDomain(result);
  }

  @Get('admin/weekly-average/:streamerId')
  @ApiOperation({
    summary: '🔒 ADMIN - Média semanal para análise administrativa',
    description:
      'Endpoint administrativo para análise detalhada de médias semanais de streamers. Permite visualização de qualquer período histórico para gestão e auditoria.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description:
      'Data de início da semana (formato: YYYY-MM-DD) - Segunda-feira',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Data de fim da semana (formato: YYYY-MM-DD) - Sábado',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Média administrativa consultada com sucesso.',
    type: WeeklyAverageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou não fornecido.',
  })
  @ApiResponse({
    status: 404,
    description: 'Streamer não encontrado.',
  })
  async getAdminWeeklyAverage(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<WeeklyAverageResponseDto> {
    // Validar e converter datas
    const startDate = new Date(startDateString + 'T00:00:00.000Z');
    const endDate = new Date(endDateString + 'T23:59:59.999Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
    }

    const result = await this.getWeeklyAverageUseCase.execute({
      streamerId,
      startDate,
      endDate,
    });

    return WeeklyAverageResponseDto.fromDomain(result);
  }

  @Get('admin/daily-week')
  @ApiOperation({
    summary: '🔒 ADMIN - Pontos diários para análise administrativa',
    description:
      'Endpoint administrativo para visualização detalhada de pontos diários por semana. Usado para análise histórica, auditoria e gestão de períodos no painel admin.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description:
      'Data de início da semana (formato: YYYY-MM-DD) - Segunda-feira',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Data de fim da semana (formato: YYYY-MM-DD) - Sábado',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Pontos diários administrativos consultados com sucesso.',
    type: DailyScoresWeekResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou não fornecido.',
  })
  async getAdminDailyWeek(
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<DailyScoresWeekResponseDto> {
    // Validar e converter datas
    const startDate = new Date(startDateString + 'T00:00:00.000Z');
    const endDate = new Date(endDateString + 'T23:59:59.999Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
    }

    const result = await this.getDailyScoresWeekUseCase.execute({
      startDate,
      endDate,
    });

    return DailyScoresWeekResponseDto.fromDomain(result);
  }

  @Get('admin/period-summary')
  @ApiOperation({
    summary: '🔒 ADMIN - Resumo completo de período',
    description:
      'Endpoint administrativo que retorna um resumo completo de um período específico, incluindo ranking, estatísticas gerais e dados para fechamento de período.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Data de início do período (formato: YYYY-MM-DD)',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'Data de fim do período (formato: YYYY-MM-DD)',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo do período consultado com sucesso.',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Datas inválidas ou período inválido.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou não fornecido.',
  })
  async getAdminPeriodSummary(
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<any> {
    // Validar e converter datas
    const startDate = new Date(startDateString + 'T00:00:00.000Z');
    const endDate = new Date(endDateString + 'T23:59:59.999Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Datas inválidas. Use o formato YYYY-MM-DD.');
    }

    // Buscar dados em paralelo para otimizar performance
    const [ranking, dailyScores] = await Promise.all([
      this.getWeeklyRankingUseCase.execute({ startDate, endDate }),
      this.getDailyScoresWeekUseCase.execute({ startDate, endDate }),
    ]);

    // Calcular estatísticas gerais
    const totalStreamers = ranking.ranking.length;
    const totalPoints = ranking.ranking.reduce(
      (sum, streamer) => sum + streamer.totalPoints,
      0,
    );
    const averagePointsPerStreamer =
      totalStreamers > 0 ? totalPoints / totalStreamers : 0;
    const topStreamer = ranking.ranking[0] || null;

    // Calcular pontos por dia
    const pointsByDay = dailyScores.dailyScores.reduce(
      (acc, day) => {
        const dayTotal = day.streamers.reduce(
          (sum, streamer) => sum + streamer.points,
          0,
        );
        acc[day.dayOfWeek] = dayTotal;
        return acc;
      },
      {} as { [day: string]: number },
    );

    return {
      period: {
        startDate,
        endDate,
        totalDays: dailyScores.dailyScores.length,
      },
      statistics: {
        totalStreamers,
        totalPoints,
        averagePointsPerStreamer:
          Math.round(averagePointsPerStreamer * 100) / 100,
        topStreamer: topStreamer
          ? {
              nickname: topStreamer.nickname,
              totalPoints: topStreamer.totalPoints,
              averagePoints: topStreamer.averagePoints,
            }
          : null,
      },
      pointsByDay,
      ranking: ranking.ranking,
      dailyBreakdown: dailyScores.dailyScores,
    };
  }
}
