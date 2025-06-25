import { GetDailyPointsUseCase } from '@application/use-cases/streamer/get-daily-points.use-case';
import { GetDailyScoresWeekUseCase } from '@application/use-cases/streamer/get-daily-scores-week.use-case';
import { GetReportByNicknameUseCase } from '@application/use-cases/streamer/get-report-by-nickname.use-case';
import { GetScoreReportUseCase } from '@application/use-cases/streamer/get-score-report.use-case';
import { GetWeeklyAverageUseCase } from '@application/use-cases/streamer/get-weekly-average.use-case';
import { GetWeeklyRankingUseCase } from '@application/use-cases/streamer/get-weekly-ranking.use-case';
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DailyPointsResponseDto } from '@presentation/dto/streamer/daily-points-response.dto';
import { DailyScoresWeekResponseDto } from '@presentation/dto/streamer/daily-scores-week-response.dto';
import { ScoreReportResponseDto } from '@presentation/dto/streamer/score-report-response.dto';
import { WeeklyAverageResponseDto } from '@presentation/dto/streamer/weekly-average-response.dto';
import { WeeklyRankingResponseDto } from '@presentation/dto/streamer/weekly-ranking-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { DateValidationUtil } from '../utils/date-validation.util';

@ApiTags('scores-public')
@Controller('scores/public')
@Public() // Todos os endpoints são públicos
export class PublicScoreController {
  constructor(
    private readonly getDailyPointsUseCase: GetDailyPointsUseCase,
    private readonly getScoreReportUseCase: GetScoreReportUseCase,
    private readonly getWeeklyRankingUseCase: GetWeeklyRankingUseCase,
    private readonly getWeeklyAverageUseCase: GetWeeklyAverageUseCase,
    private readonly getDailyScoresWeekUseCase: GetDailyScoresWeekUseCase,
    private readonly getReportByNicknameUseCase: GetReportByNicknameUseCase,
  ) {}

  @Get('daily-points/:streamerId')
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
  async getDailyPoints(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('date') dateString?: string,
  ): Promise<DailyPointsResponseDto> {
    let date: Date | undefined;

    if (dateString) {
      date = DateValidationUtil.parseAndValidateDate(dateString);
    }

    const result = await this.getDailyPointsUseCase.execute({
      streamerId,
      date,
    });

    return DailyPointsResponseDto.fromDomain(result);
  }

  @Get('weekly-ranking')
  @ApiOperation({
    summary: '🌐 PÚBLICO - Ranking semanal de streamers',
    description:
      'Endpoint público para visualização do ranking semanal. Usado em páginas de classificação, widgets de ranking e integrações externas.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Data de início da semana (formato: YYYY-MM-DD). Se não informado, usa a semana atual.',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description:
      'Data de fim da semana (formato: YYYY-MM-DD). Se não informado, usa a semana atual.',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranking semanal consultado com sucesso.',
    type: WeeklyRankingResponseDto,
  })
  async getWeeklyRanking(
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
  ): Promise<WeeklyRankingResponseDto> {
    const { startDate, endDate } =
      DateValidationUtil.parseOptionalDateRangeOrCurrentWeek(
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
    summary: '🌐 PÚBLICO - Média semanal de um streamer',
    description:
      'Endpoint público para consulta da média semanal de pontos de um streamer específico. Usado em perfis públicos e widgets de estatísticas.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Data de início da semana (formato: YYYY-MM-DD). Se não informado, usa a semana atual.',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description:
      'Data de fim da semana (formato: YYYY-MM-DD). Se não informado, usa a semana atual.',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Média semanal consultada com sucesso.',
    type: WeeklyAverageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Streamer não encontrado.',
  })
  async getWeeklyAverage(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
  ): Promise<WeeklyAverageResponseDto> {
    const { startDate, endDate } =
      DateValidationUtil.parseOptionalDateRangeOrCurrentWeek(
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
    summary: '🌐 PÚBLICO - Pontos diários da semana',
    description:
      'Endpoint público para visualização dos pontos diários de todos os streamers em uma semana. Usado em dashboards públicos e relatórios semanais.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Data de início da semana (formato: YYYY-MM-DD). Se não informado, usa a semana atual.',
    example: '2025-01-06',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description:
      'Data de fim da semana (formato: YYYY-MM-DD). Se não informado, usa a semana atual.',
    example: '2025-01-11',
  })
  @ApiResponse({
    status: 200,
    description: 'Pontos diários da semana consultados com sucesso.',
    type: DailyScoresWeekResponseDto,
  })
  async getDailyWeek(
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
  ): Promise<DailyScoresWeekResponseDto> {
    const { startDate, endDate } =
      DateValidationUtil.parseOptionalDateRangeOrCurrentWeek(
        startDateString,
        endDateString,
      );

    const result = await this.getDailyScoresWeekUseCase.execute({
      startDate,
      endDate,
    });

    return DailyScoresWeekResponseDto.fromDomain(result);
  }

  @Get('report/:streamerId')
  @ApiOperation({
    summary: '🌐 PÚBLICO - Relatório de pontos por período',
    description:
      'Endpoint público para relatório detalhado de pontos de um streamer em um período específico. Usado em perfis públicos e análises de performance.',
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
    example: '2025-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório consultado com sucesso.',
    type: ScoreReportResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Streamer não encontrado.',
  })
  async getScoreReport(
    @Param('streamerId', ParseIntPipe) streamerId: number,
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ): Promise<ScoreReportResponseDto> {
    const { startDate, endDate } = DateValidationUtil.parseAndValidateDateRange(
      startDateString,
      endDateString,
    );

    const result = await this.getScoreReportUseCase.execute({
      streamerId,
      startDate,
      endDate,
    });

    return ScoreReportResponseDto.fromDomain(result);
  }

  @Get('report-by-nickname/:nickname')
  @ApiOperation({
    summary: '🌐 PÚBLICO - Relatório de pontos por nickname',
    description:
      'Endpoint público para relatório de pontos usando o nickname do streamer. Usado quando não se conhece o ID do streamer.',
  })
  @ApiQuery({
    name: 'startDateTime',
    required: true,
    description: 'Data e hora de início (formato: YYYY-MM-DDTHH:mm:ss)',
    example: '2025-01-01T00:00:00',
  })
  @ApiQuery({
    name: 'endDateTime',
    required: true,
    description: 'Data e hora de fim (formato: YYYY-MM-DDTHH:mm:ss)',
    example: '2025-01-31T23:59:59',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório consultado com sucesso.',
    type: ScoreReportResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Streamer não encontrado.',
  })
  async getReportByNickname(
    @Param('nickname') nickname: string,
    @Query('startDateTime') startDateTimeString: string,
    @Query('endDateTime') endDateTimeString: string,
  ): Promise<ScoreReportResponseDto> {
    const startDateTime = new Date(startDateTimeString);
    const endDateTime = new Date(endDateTimeString);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw new Error('Datas inválidas. Use o formato YYYY-MM-DDTHH:mm:ss.');
    }

    if (startDateTime > endDateTime) {
      throw new Error('Data de início não pode ser posterior à data de fim.');
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
}
