import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisHealthService {
  private readonly logger = new Logger(RedisHealthService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Verifica se o Redis está funcionando corretamente
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const testKey = 'health:check';
      const testValue = { timestamp: Date.now(), test: true };

      // Teste de escrita
      await this.redisService.set(testKey, testValue, 5); // 5 segundos TTL

      // Teste de leitura
      const retrieved = await this.redisService.get(testKey);

      if (
        retrieved &&
        JSON.stringify(retrieved) === JSON.stringify(testValue)
      ) {
        // Limpar teste
        await this.redisService.del(testKey);

        this.logger.log('Redis health check passed');
        return {
          status: 'healthy',
          message: 'Redis is working correctly',
        };
      } else {
        throw new Error('Data integrity check failed');
      }
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return {
        status: 'unhealthy',
        message: `Redis error: ${error.message}`,
      };
    }
  }

  /**
   * Teste de performance básico
   */
  async performanceTest(): Promise<{
    status: string;
    writeTime: number;
    readTime: number;
    totalTime: number;
  }> {
    try {
      const testKey = 'performance:test';
      const testData = {
        data: 'test data for performance measurement',
        timestamp: Date.now(),
        nested: {
          array: [1, 2, 3, 4, 5],
          object: { key: 'value' },
        },
      };

      // Teste de escrita
      const writeStart = Date.now();
      await this.redisService.set(testKey, testData, 10);
      const writeTime = Date.now() - writeStart;

      // Teste de leitura
      const readStart = Date.now();
      const retrieved = await this.redisService.get(testKey);
      const readTime = Date.now() - readStart;

      // Limpar
      await this.redisService.del(testKey);

      const totalTime = writeTime + readTime;

      this.logger.log(
        `Redis performance test - Write: ${writeTime}ms, Read: ${readTime}ms, Total: ${totalTime}ms`,
      );

      return {
        status: 'success',
        writeTime,
        readTime,
        totalTime,
      };
    } catch (error) {
      this.logger.error('Redis performance test failed', error);
      throw error;
    }
  }
}
