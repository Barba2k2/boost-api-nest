import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { DeleteScoreDto } from './dto/delete-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('scores')
@Controller('score')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post('save')
  @Roles('admin', 'streamer')
  @ApiOperation({ summary: 'Criar uma nova pontuação' })
  @ApiResponse({ status: 201, description: 'Pontuação criada com sucesso.' })
  async create(@Body() createScoreDto: CreateScoreDto) {
    return this.scoresService.create(createScoreDto);
  }

  @Get()
  @Roles('admin', 'streamer', 'user')
  @ApiOperation({ summary: 'Obter todas as pontuações' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Data no formato ISO (YYYY-MM-DD)',
  })
  async findAll(@Query('date') dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : undefined;
    return this.scoresService.findAll(date);
  }

  @Delete('delete/:id')
  @Roles('admin', 'streamer')
  @ApiOperation({ summary: 'Remover uma pontuação' })
  @ApiResponse({ status: 200, description: 'Pontuação removida com sucesso.' })
  async remove(
    @Param('id') id: string,
    @Body() deleteScoreDto: DeleteScoreDto,
  ) {
    return this.scoresService.remove(+id, deleteScoreDto);
  }
}
