import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StreamersService } from './streamers.service';
import { CreateStreamerDto } from './dto/create-streamer.dto';
import { UpdateStreamerDto } from './dto/update-streamer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('streamers')
@Controller('streamers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StreamersController {
  constructor(private readonly streamersService: StreamersService) {}

  @Post('save')
  @Roles('admin')
  @ApiOperation({ summary: 'Criar um novo streamer' })
  @ApiResponse({ status: 201, description: 'Streamer criado com sucesso.' })
  async create(@Body() createStreamerDto: CreateStreamerDto) {
    return this.streamersService.create(createStreamerDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Obter todos os streamers' })
  async findAll() {
    return this.streamersService.findAll();
  }

  @Put('update/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Atualizar um streamer' })
  @ApiResponse({ status: 200, description: 'Streamer atualizado com sucesso.' })
  async update(
    @Param('id') id: string,
    @Body() updateStreamerDto: UpdateStreamerDto,
  ) {
    return this.streamersService.update(+id, updateStreamerDto);
  }

  @Delete('delete/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Remover um streamer' })
  @ApiResponse({ status: 200, description: 'Streamer removido com sucesso.' })
  async remove(@Param('id') id: string) {
    return this.streamersService.remove(+id);
  }

  @Post('status/update')
  @Roles('admin', 'streamer', 'user')
  @ApiOperation({ summary: 'Atualizar o status de um streamer' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso.' })
  async updateStatus(@Body() updateStatusDto: UpdateStatusDto) {
    return this.streamersService.updateStatus(
      +updateStatusDto.streamerId,
      updateStatusDto.status === 'ON',
    );
  }

  @Get('status/current')
  @Public()
  @ApiOperation({ summary: 'Obter o status atual de todos os streamers' })
  async getCurrentStreamersStatus() {
    return this.streamersService.getAllStreamersStatus();
  }
}
