import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { WebsocketsService } from '../websockets/websockets.service';
import { Schedule } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private websocketsService: WebsocketsService,
  ) {}

  async create(createScheduleDtos: CreateScheduleDto | CreateScheduleDto[]) {
    const dtos = Array.isArray(createScheduleDtos)
      ? createScheduleDtos
      : [createScheduleDtos];
    const results: Schedule[] = [];

    for (const dto of dtos) {
      // Verificar se já existe um agendamento no mesmo horário
      const existingSchedule = await this.prisma.schedule.findFirst({
        where: {
          date: dto.date,
          startTime: dto.startTime,
          endTime: dto.endTime,
        },
      });

      if (existingSchedule) {
        // Se existir e o streamer for diferente, atualiza o streamer
        if (existingSchedule.streamerUrl !== dto.streamerUrl) {
          const updated = await this.prisma.schedule.update({
            where: { id: existingSchedule.id },
            data: { streamerUrl: dto.streamerUrl },
          });
          results.push(updated);
        } else {
          results.push(existingSchedule);
        }
      } else {
        // Se não existir, cria um novo agendamento
        const created = await this.prisma.schedule.create({
          data: {
            streamerUrl: dto.streamerUrl,
            date: dto.date,
            startTime: dto.startTime,
            endTime: dto.endTime,
          },
        });
        results.push(created);
      }
    }

    // Notificar os clientes WebSocket sobre a alteração
    this.websocketsService.notifyScheduleUpdate(results);

    return results;
  }

  findAll() {
    return this.prisma.schedule.findMany({
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  findByDate(date: Date) {
    return this.prisma.schedule.findMany({
      where: {
        date: {
          equals: date,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async update(updateScheduleDtos: UpdateScheduleDto | UpdateScheduleDto[]) {
    const dtos = Array.isArray(updateScheduleDtos)
      ? updateScheduleDtos
      : [updateScheduleDtos];
    const results: Schedule[] = [];

    for (const dto of dtos) {
      // Verificar se o agendamento existe
      const existingSchedule = await this.prisma.schedule.findUnique({
        where: { id: dto.id },
      });

      if (!existingSchedule) {
        throw new NotFoundException(
          `Agendamento com ID ${dto.id} não encontrado`,
        );
      }

      // Atualizar o agendamento
      const updated = await this.prisma.schedule.update({
        where: { id: dto.id },
        data: {
          streamerUrl: dto.streamerUrl,
          date: dto.date,
          startTime: dto.startTime,
          endTime: dto.endTime,
        },
      });

      results.push(updated);
    }

    // Notificar os clientes WebSocket sobre a alteração
    this.websocketsService.notifyScheduleUpdate(results);

    return results;
  }

  forceUpdate(data: any) {
    // Apenas notifica os clientes WebSocket com os dados fornecidos
    this.websocketsService.notifyScheduleUpdate(data);
    return { message: 'Atualização forçada enviada com sucesso' };
  }
}
