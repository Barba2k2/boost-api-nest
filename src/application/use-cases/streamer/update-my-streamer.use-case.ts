import { Streamer } from '@domain/entities/streamer.entity';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IStreamerRepository,
  STREAMER_REPOSITORY_TOKEN,
  UpdateStreamerData,
} from '../../ports/repositories/streamer.repository.interface';

export interface UpdateMyStreamerCommand {
  userId: number;
  platforms?: string[];
  streamDays?: string[];
  startTime?: string;
  endTime?: string;
}

@Injectable()
export class UpdateMyStreamerUseCase {
  constructor(
    @Inject(STREAMER_REPOSITORY_TOKEN)
    private readonly streamerRepository: IStreamerRepository,
  ) {}

  async execute(command: UpdateMyStreamerCommand): Promise<Streamer> {
    // Buscar streamer pelo userId
    const streamer = await this.streamerRepository.findByUserId(command.userId);

    if (!streamer) {
      throw new NotFoundException(
        'Perfil de streamer não encontrado para este usuário',
      );
    }

    // Preparar dados para atualização
    const updateData: UpdateStreamerData = {};
    if (command.platforms !== undefined)
      updateData.platforms = command.platforms;
    if (command.streamDays !== undefined)
      updateData.streamDays = command.streamDays;
    if (command.startTime !== undefined)
      updateData.startTime = command.startTime;
    if (command.endTime !== undefined) updateData.endTime = command.endTime;

    // Se não há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Nenhum dado fornecido para atualização');
    }

    return await this.streamerRepository.update(streamer.id, updateData);
  }
}
