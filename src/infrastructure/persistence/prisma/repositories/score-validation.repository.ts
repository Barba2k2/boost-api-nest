import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ScoreValidationRepository {
  private readonly DAILY_POINTS_LIMIT = 240;
  private readonly HOURLY_POINTS_LIMIT = 10;

  constructor(private readonly prisma: PrismaService) {}

  async validateScoreCreation(
    streamerId: number,
    date: Date,
    hour: number,
    points: number,
  ): Promise<void> {
    // 1. Verificar se já existe score nos últimos 6 minutos para este streamer
    await this.validateNoDuplicateInLastSixMinutes(streamerId, date);

    // 2. Só validar limite para pontos positivos
    if (points > 0) {
      // Verificar limite por hora
      await this.validateHourlyPointsLimit(streamerId, date, hour, points);

      // Verificar se adicionar estes pontos ultrapassará o limite diário
      await this.validateDailyPointsLimit(streamerId, date, points);
    }
  }

  async getDailyPointsByStreamerAndDate(
    streamerId: number,
    date: Date,
  ): Promise<number> {
    // Criar o início e fim do dia (00:00:00 até 23:59:59)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.score.aggregate({
      where: {
        streamerId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        points: {
          gt: 0, // Só somar pontos positivos para o limite
        },
      },
      _sum: { points: true },
    });

    return result._sum.points || 0;
  }

  private async validateDailyPointsLimit(
    streamerId: number,
    date: Date,
    newPoints: number,
  ): Promise<void> {
    const currentDailyPoints = await this.getDailyPointsByStreamerAndDate(
      streamerId,
      date,
    );

    const newTotal = currentDailyPoints + newPoints;
    if (newTotal > this.DAILY_POINTS_LIMIT) {
      const remainingPoints = this.DAILY_POINTS_LIMIT - currentDailyPoints;
      throw new BadRequestException(
        `Limite diário de ${this.DAILY_POINTS_LIMIT} pontos excedido. ` +
          `Pontos atuais do dia: ${currentDailyPoints}. ` +
          `Pontos restantes: ${Math.max(0, remainingPoints)}.`,
      );
    }
  }

  private async validateHourlyPointsLimit(
    streamerId: number,
    date: Date,
    hour: number,
    newPoints: number,
  ): Promise<void> {
    // Buscar todos os pontos positivos desta hora específica
    const startOfHour = new Date(date);
    startOfHour.setHours(hour, 0, 0, 0);

    const endOfHour = new Date(date);
    endOfHour.setHours(hour, 59, 59, 999);

    const result = await this.prisma.score.aggregate({
      where: {
        streamerId,
        date: {
          gte: startOfHour,
          lte: endOfHour,
        },
        points: {
          gt: 0, // Só somar pontos positivos
        },
      },
      _sum: { points: true },
    });

    const currentHourlyPoints = result._sum.points || 0;
    const newTotal = currentHourlyPoints + newPoints;

    if (newTotal > this.HOURLY_POINTS_LIMIT) {
      const remainingPoints = this.HOURLY_POINTS_LIMIT - currentHourlyPoints;
      throw new BadRequestException(
        `Limite de ${this.HOURLY_POINTS_LIMIT} pontos por hora excedido. ` +
          `Pontos atuais da hora ${hour}h: ${currentHourlyPoints}. ` +
          `Pontos restantes: ${Math.max(0, remainingPoints)}.`,
      );
    }
  }

  private async validateNoDuplicateInLastSixMinutes(
    streamerId: number,
    currentTime: Date,
  ): Promise<void> {
    // Calcular 6 minutos atrás
    const sixMinutesAgo = new Date(currentTime.getTime() - 6 * 60 * 1000);

    // Buscar scores criados nos últimos 6 minutos para este streamer
    const recentScores = await this.prisma.score.findMany({
      where: {
        streamerId,
        date: {
          gte: sixMinutesAgo,
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 1,
    });

    if (recentScores.length > 0) {
      const lastScore = recentScores[0];
      const timeDiff = currentTime.getTime() - lastScore.date.getTime();
      const minutesLeft = Math.ceil((6 * 60 * 1000 - timeDiff) / (60 * 1000));

      throw new BadRequestException(
        `Score duplicado detectado. Último score criado há ${Math.floor(
          timeDiff / (60 * 1000),
        )} minuto(s). ` +
          `Aguarde ${minutesLeft} minuto(s) antes de criar outro score.`,
      );
    }
  }
}
