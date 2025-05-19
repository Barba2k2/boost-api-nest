import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ScoresService } from './scores.service';
import { ScoreFilterDto } from './dto/score-filter.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('public-scores')
@Controller('public/score')
@Public()
export class PublicScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  @ApiOperation({ summary: 'Obter pontuações com filtros (acesso público)' })
  @ApiResponse({ status: 200, description: 'Retorna as pontuações filtradas.' })
  @ApiQuery({ name: 'nickname', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'startHour', required: false, type: Number })
  @ApiQuery({ name: 'endHour', required: false, type: Number })
  async getScoresWithFilters(@Query() filterDto: ScoreFilterDto) {
    return this.scoresService.findWithFilters(filterDto);
  }
}
