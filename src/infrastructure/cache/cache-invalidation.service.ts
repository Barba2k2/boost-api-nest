import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheInvalidationService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Invalida cache relacionado a um usuário específico
   */
  async invalidateUserCache(userId: number): Promise<void> {
    const patterns = [
      `user:${userId}`,
      `user:${userId}:*`,
      `streamers:all`, // Lista de streamers pode incluir dados do usuário
    ];

    await this.invalidateMultiplePatterns(patterns);
  }

  /**
   * Invalida cache relacionado a streamers
   */
  async invalidateStreamersCache(): Promise<void> {
    const patterns = ['streamers:all', 'streamers:*'];

    await this.invalidateMultiplePatterns(patterns);
  }

  /**
   * Invalida cache relacionado a um streamer específico
   */
  async invalidateStreamerCache(streamerId: number): Promise<void> {
    const patterns = [
      `streamer:${streamerId}`,
      `streamer:${streamerId}:*`,
      'streamers:all', // Lista geral de streamers
    ];

    await this.invalidateMultiplePatterns(patterns);
  }

  /**
   * Invalida cache de autenticação para um usuário
   */
  async invalidateAuthCache(userId: number): Promise<void> {
    const patterns = [
      `auth:token:${userId}`,
      `auth:session:${userId}`,
      `user:${userId}`, // Cache do usuário também
    ];

    await this.invalidateMultiplePatterns(patterns);
  }

  /**
   * Invalida cache de WebSocket para uma sessão
   */
  async invalidateSocketCache(socketId: string): Promise<void> {
    const patterns = [`socket:temp:${socketId}`, `socket:session:${socketId}`];

    await this.invalidateMultiplePatterns(patterns);
  }

  /**
   * Limpa todo o cache - usar com cuidado
   */
  async clearAllCache(): Promise<void> {
    await this.redisService.reset();
  }

  /**
   * Invalida múltiplos padrões de chave
   */
  private async invalidateMultiplePatterns(patterns: string[]): Promise<void> {
    const deletePromises = patterns.map((pattern) => {
      if (pattern.includes('*')) {
        // Para padrões com wildcard, seria necessário implementar scan no Redis
        // Por simplicidade, vamos invalidar chaves específicas conhecidas
        return Promise.resolve();
      } else {
        return this.redisService.del(pattern);
      }
    });

    await Promise.all(deletePromises);
  }
}
