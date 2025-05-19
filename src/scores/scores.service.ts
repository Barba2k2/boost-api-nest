import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { DeleteScoreDto } from './dto/delete-score.dto';
import { ScoreFilterDto } from './dto/score-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScoresService {
  constructor(private prisma: PrismaService) {}

  async create(createScoreDto: CreateScoreDto) {
    // Verificar se o streamer existe
    const streamer = await this.prisma.streamer.findUnique({
      where: { id: createScoreDto.streamerId },
    });

    if (!streamer) {
      throw new NotFoundException(
        `Streamer com ID ${createScoreDto.streamerId} não encontrado`,
      );
    }

    try {
      // Criar a pontuação
      const score = await this.prisma.score.create({
        data: {
          streamerId: createScoreDto.streamerId,
          date: createScoreDto.date,
          hour: createScoreDto.hour,
          minute: createScoreDto.minute || 0,
          points: createScoreDto.points,
        },
      });

      return score;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Já existe uma pontuação para este streamer nesta data e hora',
        );
      }
      throw error;
    }
  }

  async findAll(date?: Date) {
    const whereClause = date
      ? Prisma.sql`WHERE DATE(s.date) = DATE(${date})`
      : Prisma.sql``;

    const scoresWithStreamers = await this.prisma.$queryRaw`
      SELECT s.id, s.streamer_id as "streamerId", s.date, s.hour, s.minute, s.points, u.nickname
      FROM scores s
      JOIN streamers st ON s.streamer_id = st.id
      JOIN users u ON st.user_id = u.id
      ${whereClause}
      ORDER BY s.points DESC
    `;

    return scoresWithStreamers;
  }

  async findWithFilters(filter: ScoreFilterDto) {
    // Construir a condição WHERE
    let whereClause = `WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;

    if (filter.nickname) {
      whereClause += ` AND u.nickname ILIKE $${paramCount}`;
      params.push(`%${filter.nickname}%`);
      paramCount++;
    }

    if (filter.startDate) {
      whereClause += ` AND s.date >= $${paramCount}`;
      params.push(filter.startDate);
      paramCount++;
    }

    if (filter.endDate) {
      whereClause += ` AND s.date <= $${paramCount}`;
      params.push(filter.endDate);
      paramCount++;
    }

    if (filter.startHour !== undefined) {
      whereClause += ` AND s.hour >= $${paramCount}`;
      params.push(filter.startHour);
      paramCount++;
    }

    if (filter.endHour !== undefined) {
      whereClause += ` AND s.hour <= $${paramCount}`;
      params.push(filter.endHour);
      paramCount++;
    }

    // Executar a consulta
    const scoresWithStreamers = await this.prisma.$queryRawUnsafe(
      `
      SELECT s.id, s.streamer_id as "streamerId", s.date, s.hour, s.minute, s.points, u.nickname
      FROM scores s
      JOIN streamers st ON s.streamer_id = st.id
      JOIN users u ON st.user_id = u.id
      ${whereClause}
      ORDER BY s.date DESC, s.hour, s.points DESC
    `,
      ...params,
    );

    return scoresWithStreamers;
  }

  async remove(streamerId: number, deleteScoreDto: DeleteScoreDto) {
    // Verificar se a pontuação existe
    const score = await this.prisma.score.findFirst({
      where: {
        streamerId,
        date: deleteScoreDto.date,
        hour: deleteScoreDto.hour,
      },
    });

    if (!score) {
      throw new NotFoundException('Pontuação não encontrada');
    }

    // Remover a pontuação
    await this.prisma.score.deleteMany({
      where: {
        streamerId,
        date: deleteScoreDto.date,
        hour: deleteScoreDto.hour,
      },
    });

    return { message: 'Pontuação removida com sucesso' };
  }
}
