import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Máximo de requisições na janela
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  totalRequests: number;
}

@Injectable()
export class RateLimitService {
  private readonly RATE_LIMIT_PREFIX = 'rate_limit';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Verifica se uma requisição está dentro do limite
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const key = config.keyGenerator
      ? config.keyGenerator(identifier)
      : `${this.RATE_LIMIT_PREFIX}:${identifier}`;

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Usar uma estrutura de lista para rastrear timestamps das requisições
    const requestKey = `${key}:requests`;
    const countKey = `${key}:count`;

    // Obter contagem atual
    let currentCount = (await this.redisService.get<number>(countKey)) || 0;

    if (currentCount >= config.maxRequests) {
      // Verificar se a janela expirou
      const oldestRequest = await this.redisService.get<number>(
        `${key}:oldest`,
      );

      if (oldestRequest && now - oldestRequest >= config.windowMs) {
        // Janela expirou, resetar contador
        await this.resetRateLimit(key);
        currentCount = 0;
      } else {
        // Limite excedido
        const resetTime = oldestRequest
          ? oldestRequest + config.windowMs
          : now + config.windowMs;
        return {
          allowed: false,
          remainingRequests: 0,
          resetTime,
          totalRequests: currentCount,
        };
      }
    }

    // Incrementar contador
    const newCount = currentCount + 1;
    const windowTtl = Math.ceil(config.windowMs / 1000);

    // Armazenar contagem atualizada
    await this.redisService.setex(countKey, windowTtl, newCount);

    // Se é a primeira requisição da janela, armazenar timestamp
    if (newCount === 1) {
      await this.redisService.setex(`${key}:oldest`, windowTtl, now);
    }

    return {
      allowed: true,
      remainingRequests: config.maxRequests - newCount,
      resetTime: now + config.windowMs,
      totalRequests: newCount,
    };
  }

  /**
   * Rate limiting específico para login
   */
  async checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5, // 5 tentativas por 15 minutos
      keyGenerator: (id) => `${this.RATE_LIMIT_PREFIX}:login:${id}`,
    });
  }

  /**
   * Rate limiting para API geral
   */
  async checkApiRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 100, // 100 requisições por minuto
      keyGenerator: (id) => `${this.RATE_LIMIT_PREFIX}:api:${id}`,
    });
  }

  /**
   * Rate limiting para criação de recursos
   */
  async checkCreateRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 10, // 10 criações por minuto
      keyGenerator: (id) => `${this.RATE_LIMIT_PREFIX}:create:${id}`,
    });
  }

  /**
   * Rate limiting para WebSocket connections
   */
  async checkSocketRateLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit(identifier, {
      windowMs: 5 * 60 * 1000, // 5 minutos
      maxRequests: 10, // 10 conexões por 5 minutos
      keyGenerator: (id) => `${this.RATE_LIMIT_PREFIX}:socket:${id}`,
    });
  }

  /**
   * Reseta o rate limit para um identificador específico
   */
  async resetRateLimit(baseKey: string): Promise<void> {
    const keys = [
      `${baseKey}:count`,
      `${baseKey}:oldest`,
      `${baseKey}:requests`,
    ];

    await Promise.all(keys.map((key) => this.redisService.del(key)));
  }

  /**
   * Reseta rate limit por tipo
   */
  async resetRateLimitByType(
    identifier: string,
    type: 'login' | 'api' | 'create' | 'socket',
  ): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}:${type}:${identifier}`;
    await this.resetRateLimit(key);
  }

  /**
   * Incrementa contadores de tentativas falhadas (para bloqueio temporário)
   */
  async incrementFailedAttempts(
    identifier: string,
    windowMs: number = 60 * 60 * 1000,
  ): Promise<number> {
    const key = `${this.RATE_LIMIT_PREFIX}:failed:${identifier}`;
    const attempts = await this.redisService.incr(key);

    // Definir TTL apenas na primeira tentativa
    if (attempts === 1) {
      await this.redisService.setex(key, Math.ceil(windowMs / 1000), attempts);
    }

    return attempts;
  }

  /**
   * Obtém número de tentativas falhadas
   */
  async getFailedAttempts(identifier: string): Promise<number> {
    const key = `${this.RATE_LIMIT_PREFIX}:failed:${identifier}`;
    return (await this.redisService.get<number>(key)) || 0;
  }

  /**
   * Limpa tentativas falhadas (após login bem-sucedido)
   */
  async clearFailedAttempts(identifier: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}:failed:${identifier}`;
    await this.redisService.del(key);
  }

  /**
   * Verifica se um identificador está bloqueado temporariamente
   */
  async isTemporarilyBlocked(
    identifier: string,
    maxAttempts: number = 5,
  ): Promise<boolean> {
    const attempts = await this.getFailedAttempts(identifier);
    return attempts >= maxAttempts;
  }
}
