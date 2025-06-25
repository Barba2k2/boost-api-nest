import { GetAdminPeriodSummaryUseCase } from '@application/use-cases/streamer/get-admin-period-summary.use-case';
import { GetDailyScoresWeekUseCase } from '@application/use-cases/streamer/get-daily-scores-week.use-case';
import { GetWeeklyAverageUseCase } from '@application/use-cases/streamer/get-weekly-average.use-case';
import { GetWeeklyRankingUseCase } from '@application/use-cases/streamer/get-weekly-ranking.use-case';
import { UserRole } from '@domain/entities/user.entity';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DailyScoresWeekResponseDto } from '@presentation/dto/streamer/daily-scores-week-response.dto';
import { WeeklyAverageResponseDto } from '@presentation/dto/streamer/weekly-average-response.dto';
import { WeeklyRankingResponseDto } from '@presentation/dto/streamer/weekly-ranking-response.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { DateValidationUtil } from '../utils/date-validation.util';

@ApiTags('scores-admin')
@Controller('scores/admin')
@Roles(UserRole.ADMIN) // Todos os endpoints requerem role de admin
export class AdminScoreController {
  constructor(
    private readonly getWeeklyRankingUseCase: GetWeeklyRankingUseCase,
    private readonly getWeeklyAverageUseCase: GetWeeklyAverageUseCase,
    private readonly getDailyScoresWeekUseCase: GetDailyScoresWeekUseCase,
    private readonly getAdminPeriodSummaryUseCase: GetAdminPeriodSummaryUseCase,
  ) {}

  @Get('weekly-ranking')
  @ApiOperation({
    summary: '🔒 ADMIN - Ranking semanal para análise administrativa',
    description:
      'Endpoint administrativo para visualização detalhada do ranking semanal. Usado para análise histórica, auditoria e gestão de períodos no painel admin.',
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
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas administradores podem acessar.',
  })
  async getWeeklyRanking(
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<WeeklyRankingResponseDto> {
    const { startDate, endDate } = DateValidationUtil.parseAndValidateDateRange(
      startDateString,
      endDateString,
    );

    const result = await this.getWeeklyRankingUseCase.execute({
      startDate,
      endDate,
    });

    return WeeklyRankingResponseDto.fromDomain(result);
  }

  @Get('weekly-average/:streamerId')
  @ApiOperation({
    summary: '🔒 ADMIN - Média semanal para análise administrativa',
    description:
      'Endpoint administrativo para visualização detalhada da média semanal de um streamer. Usado para análise histórica, auditoria e gestão de períodos no painel admin.',
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
    status: 403,
    description: 'Acesso negado. Apenas administradores podem acessar.',
  })
  @ApiResponse({
    status: 404,
    description: 'Streamer não encontrado.',
  })
  async getWeeklyAverage(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<WeeklyAverageResponseDto> {
    const { startDate, endDate } = DateValidationUtil.parseAndValidateDateRange(
      startDateString,
      endDateString,
    );

    const result = await this.getWeeklyAverageUseCase.execute({
      streamerId,
      startDate,
      endDate,
    });

    return WeeklyAverageResponseDto.fromDomain(result);
  }

  @Get('daily-week')
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
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas administradores podem acessar.',
  })
  async getDailyWeek(
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<DailyScoresWeekResponseDto> {
    const { startDate, endDate } = DateValidationUtil.parseAndValidateDateRange(
      startDateString,
      endDateString,
    );

    const result = await this.getDailyScoresWeekUseCase.execute({
      startDate,
      endDate,
    });

    return DailyScoresWeekResponseDto.fromDomain(result);
  }

  @Get('period-summary')
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
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas administradores podem acessar.',
  })
  async getPeriodSummary(
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<any> {
    const { startDate, endDate } = DateValidationUtil.parseAndValidateDateRange(
      startDateString,
      endDateString,
    );

    return await this.getAdminPeriodSummaryUseCase.execute({
      startDate,
      endDate,
    });
  }
}
