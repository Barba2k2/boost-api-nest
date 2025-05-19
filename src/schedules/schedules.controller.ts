import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('save')
  @Roles('admin', 'streamer')
  @ApiOperation({ summary: 'Criar novos agendamentos' })
  @ApiResponse({
    status: 201,
    description: 'Agendamentos criados com sucesso.',
  })
  async create(
    @Body() createScheduleDto: CreateScheduleDto | CreateScheduleDto[],
  ) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  @Roles('admin', 'streamer', 'user')
  @ApiOperation({ summary: 'Obter todos os agendamentos' })
  async findAll() {
    return this.schedulesService.findAll();
  }

  @Get('get')
  @Roles('admin', 'streamer', 'user')
  @ApiOperation({ summary: 'Obter agendamentos por data' })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Data no formato ISO (YYYY-MM-DD)',
  })
  async findByDate(@Query('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.schedulesService.findByDate(date);
  }

  @Post('update')
  @Roles('admin', 'streamer')
  @ApiOperation({ summary: 'Atualizar agendamentos' })
  @ApiResponse({
    status: 200,
    description: 'Agendamentos atualizados com sucesso.',
  })
  async update(
    @Body() updateScheduleDto: UpdateScheduleDto | UpdateScheduleDto[],
  ) {
    return this.schedulesService.update(updateScheduleDto);
  }

  @Post('force-update')
  @Roles('admin')
  @ApiOperation({ summary: 'Forçar atualização de agendamentos' })
  @ApiResponse({
    status: 200,
    description: 'Atualização forçada enviada com sucesso.',
  })
  async forceUpdate(@Body() data: any) {
    return this.schedulesService.forceUpdate(data);
  }
}
