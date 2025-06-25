import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Define um valor no cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Obtém um valor do cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cacheManager.get<T>(key);
    return value === null ? undefined : value;
  }

  /**
   * Remove um valor do cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Limpa todo o cache
   */
  async reset(): Promise<void> {
    // Método reset pode não estar disponível em todas as versões
    // Implementação alternativa pode ser necessária dependendo da versão
    if (
      'reset' in this.cacheManager &&
      typeof this.cacheManager.reset === 'function'
    ) {
      await (this.cacheManager as any).reset();
    }
  }

  /**
   * Verifica se uma chave existe no cache
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Define um valor com expiração em segundos
   */
  async setex(key: string, seconds: number, value: any): Promise<void> {
    await this.set(key, value, seconds * 1000); // convertendo para milissegundos
  }

  /**
   * Incrementa um valor numérico no cache
   */
  async incr(key: string): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newValue = current + 1;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Define múltiplas chaves de uma vez
   */
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    const promises = Object.entries(keyValuePairs).map(([key, value]) =>
      this.set(key, value, ttl),
    );
    await Promise.all(promises);
  }

  /**
   * Obtém múltiplas chaves de uma vez
   */
  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    const promises = keys.map((key) => this.get<T>(key));
    return await Promise.all(promises);
  }
}
