import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RateLimitService } from '../rate-limit.service';

@Injectable()
export class ScoreRateLimitInterceptor implements NestInterceptor {
  constructor(private readonly rateLimitService: RateLimitService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { streamerId } = request.body;

    if (!streamerId) {
      throw new HttpException(
        'streamerId é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Rate limit específico para criação de scores: 1 request por 6 minutos por streamer
    const result = await this.rateLimitService.checkRateLimit(
      `score-creation-${streamerId}`,
      {
        windowMs: 6 * 60 * 1000, // 6 minutos
        maxRequests: 1, // Máximo 1 request por janela
        keyGenerator: (id) => `score:creation:${id}`,
      },
    );

    if (!result.allowed) {
      const resetTimeInMinutes = Math.ceil(
        (result.resetTime - Date.now()) / (60 * 1000),
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Limite de criação de score excedido. Só é possível criar 1 score a cada 6 minutos por streamer.`,
          details: {
            nextAllowedIn: `${resetTimeInMinutes} minuto(s)`,
            streamerId,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}
