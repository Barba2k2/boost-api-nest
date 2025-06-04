import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { CacheInvalidationService } from './cache-invalidation.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';
import { RateLimitService } from './rate-limit.service';
import { RedisHealthService } from './redis-health.service';
import { RedisService } from './redis.service';
import { SessionService } from './session.service';
import { WebSocketCacheService } from './websocket-cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );

        return {
          store: redisStore,
          url: redisUrl,
          ttl: 300, // 5 minutos por padrão
          max: 100, // máximo de 100 items no cache
        };
      },
    }),
  ],
  providers: [
    RedisService,
    CacheInvalidationService,
    CacheInterceptor,
    RedisHealthService,
    SessionService,
    RateLimitService,
    RateLimitInterceptor,
    WebSocketCacheService,
  ],
  exports: [
    CacheModule,
    RedisService,
    CacheInvalidationService,
    CacheInterceptor,
    RedisHealthService,
    SessionService,
    RateLimitService,
    RateLimitInterceptor,
    WebSocketCacheService,
  ],
})
export class CacheRedisModule {}
