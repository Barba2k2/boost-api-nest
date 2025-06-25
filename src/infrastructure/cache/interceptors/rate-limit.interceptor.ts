import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RateLimitConfig, RateLimitService } from '../rate-limit.service';

export const RATE_LIMIT_METADATA = 'rate_limit_config';

/**
 * Decorator para configurar rate limiting em métodos/controllers
 */
export const RateLimit = (
  config: Partial<RateLimitConfig> & {
    type?: 'login' | 'api' | 'create' | 'socket';
  },
) => {
  return (
    target: any,
    propertyName?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    const targetMethod = descriptor?.value || target;
    Reflect.defineMetadata(RATE_LIMIT_METADATA, config, targetMethod);
    return descriptor || target;
  };
};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const rateLimitConfig =
      this.reflector.get(RATE_LIMIT_METADATA, context.getHandler()) ||
      this.reflector.get(RATE_LIMIT_METADATA, context.getClass());

    if (!rateLimitConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Determinar identificador para rate limiting
    const identifier = this.getIdentifier(request, rateLimitConfig);

    // Verificar rate limit baseado no tipo ou configuração personalizada
    let rateLimitResult;

    if (rateLimitConfig.type) {
      switch (rateLimitConfig.type) {
        case 'login':
          rateLimitResult =
            await this.rateLimitService.checkLoginRateLimit(identifier);
          break;
        case 'api':
          rateLimitResult =
            await this.rateLimitService.checkApiRateLimit(identifier);
          break;
        case 'create':
          rateLimitResult =
            await this.rateLimitService.checkCreateRateLimit(identifier);
          break;
        case 'socket':
          rateLimitResult =
            await this.rateLimitService.checkSocketRateLimit(identifier);
          break;
        default:
          rateLimitResult =
            await this.rateLimitService.checkApiRateLimit(identifier);
      }
    } else {
      // Usar configuração personalizada
      const config: RateLimitConfig = {
        windowMs: rateLimitConfig.windowMs || 60 * 1000,
        maxRequests: rateLimitConfig.maxRequests || 100,
        keyGenerator: rateLimitConfig.keyGenerator,
      };
      rateLimitResult = await this.rateLimitService.checkRateLimit(
        identifier,
        config,
      );
    }

    // Adicionar headers de rate limiting na resposta
    response.setHeader('X-RateLimit-Limit', rateLimitConfig.maxRequests || 100);
    response.setHeader(
      'X-RateLimit-Remaining',
      rateLimitResult.remainingRequests,
    );
    response.setHeader(
      'X-RateLimit-Reset',
      new Date(rateLimitResult.resetTime).toISOString(),
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000,
      );
      response.setHeader('Retry-After', retryAfter);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Muitas requisições. Tente novamente mais tarde.',
          error: 'Too Many Requests',
          retryAfter,
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }

  private getIdentifier(request: any, config: any): string {
    // Usar identificador personalizado se fornecido
    if (config.identifierExtractor) {
      return config.identifierExtractor(request);
    }

    // Prioridade: usuário autenticado > IP
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }

    // Fallback para IP (considerar proxy headers)
    const ip = this.getClientIp(request);
    return `ip:${ip}`;
  }

  private getClientIp(request: any): string {
    // Verificar headers de proxy primeiro
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      // Pegar o primeiro IP da lista (cliente real)
      return forwarded.split(',')[0].trim();
    }

    return (
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}
