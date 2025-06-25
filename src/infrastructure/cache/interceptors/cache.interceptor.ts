import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { Observable, of, tap } from 'rxjs';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Decorator para marcar métodos que devem ser cacheados
 */
export const CacheResult = (key: string, ttl: number = 300) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value);
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );
    const cacheTtl = this.reflector.get(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    // Construir chave de cache dinâmica baseada nos parâmetros
    const request = context.switchToHttp().getRequest();
    const dynamicKey = this.buildCacheKey(cacheKey, request);

    // Tentar buscar do cache
    const cachedResult = await this.cacheManager.get(dynamicKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    // Se não estiver no cache, executar o método e cachear o resultado
    return next.handle().pipe(
      tap(async (data) => {
        if (data) {
          await this.cacheManager.set(dynamicKey, data, cacheTtl * 1000);
        }
      }),
    );
  }

  private buildCacheKey(baseKey: string, request: any): string {
    const { params, query, user } = request;
    const keyParts = [baseKey];

    // Adicionar parâmetros da rota
    if (params) {
      Object.values(params).forEach((param) => keyParts.push(String(param)));
    }

    // Adicionar query parameters relevantes
    if (query) {
      Object.entries(query)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([key, value]) => keyParts.push(`${key}:${value}`));
    }

    // Adicionar ID do usuário se disponível (para cache por usuário)
    if (user?.id) {
      keyParts.push(`user:${user.id}`);
    }

    return keyParts.join(':');
  }
}
