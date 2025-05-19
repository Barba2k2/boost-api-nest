import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async findByToken(@Req() req) {
    const user = await this.usersService.findById(Number(req.user.userId));

    return {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      streamerId: user.streamer?.id || null,
    };
  }
}
