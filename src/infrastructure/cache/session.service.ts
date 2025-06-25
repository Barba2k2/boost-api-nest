import { User } from '@domain/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface SessionData {
  userId: number;
  nickname: string;
  role: string;
  loginTime: number;
  lastActivity: number;
  ip?: string;
  userAgent?: string;
}

export interface ActiveSession {
  sessionId: string;
  data: SessionData;
  expiresAt: number;
}

@Injectable()
export class SessionService {
  private readonly SESSION_PREFIX = 'session';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions';
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 horas em segundos

  constructor(private readonly redisService: RedisService) {}

  /**
   * Cria uma nova sessão para o usuário
   */
  async createSession(
    user: User,
    metadata?: { ip?: string; userAgent?: string },
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const sessionData: SessionData = {
      userId: user.id,
      nickname: user.nickname,
      role: user.role,
      loginTime: now,
      lastActivity: now,
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
    };

    // Armazenar sessão
    await this.redisService.setex(
      `${this.SESSION_PREFIX}:${sessionId}`,
      this.DEFAULT_TTL,
      sessionData,
    );

    // Adicionar à lista de sessões do usuário
    await this.addUserSession(user.id, sessionId);

    return sessionId;
  }

  /**
   * Busca dados da sessão
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = `${this.SESSION_PREFIX}:${sessionId}`;
    const sessionData = await this.redisService.get<SessionData>(sessionKey);

    if (sessionData) {
      // Atualizar última atividade
      sessionData.lastActivity = Date.now();
      await this.redisService.setex(sessionKey, this.DEFAULT_TTL, sessionData);
    }

    return sessionData || null;
  }

  /**
   * Remove uma sessão específica
   */
  async removeSession(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);

    if (sessionData) {
      // Remover da lista de sessões do usuário
      await this.removeUserSession(sessionData.userId, sessionId);
    }

    // Remover a sessão
    await this.redisService.del(`${this.SESSION_PREFIX}:${sessionId}`);
  }

  /**
   * Remove todas as sessões de um usuário
   */
  async removeAllUserSessions(userId: number): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    const deletePromises = sessions.map((sessionId) =>
      this.redisService.del(`${this.SESSION_PREFIX}:${sessionId}`),
    );

    await Promise.all(deletePromises);
    await this.redisService.del(`${this.USER_SESSIONS_PREFIX}:${userId}`);
  }

  /**
   * Lista todas as sessões ativas de um usuário
   */
  async getActiveUserSessions(userId: number): Promise<ActiveSession[]> {
    const sessionIds = await this.getUserSessions(userId);
    const sessionPromises = sessionIds.map(async (sessionId) => {
      const data = await this.getSession(sessionId);
      return data
        ? {
            sessionId,
            data,
            expiresAt: data.lastActivity + this.DEFAULT_TTL * 1000,
          }
        : null;
    });

    const sessions = await Promise.all(sessionPromises);
    return sessions.filter((session) => session !== null) as ActiveSession[];
  }

  /**
   * Valida se uma sessão é válida
   */
  async isValidSession(sessionId: string): Promise<boolean> {
    const sessionData = await this.getSession(sessionId);
    return sessionData !== null;
  }

  /**
   * Estende o tempo de vida de uma sessão
   */
  async extendSession(sessionId: string): Promise<boolean> {
    const sessionData = await this.getSession(sessionId);

    if (!sessionData) {
      return false;
    }

    sessionData.lastActivity = Date.now();
    await this.redisService.setex(
      `${this.SESSION_PREFIX}:${sessionId}`,
      this.DEFAULT_TTL,
      sessionData,
    );

    return true;
  }

  /**
   * Conta sessões ativas totais
   */
  async getActiveSessionsCount(): Promise<number> {
    // Implementação simplificada - em produção usaria SCAN
    return 0; // Placeholder
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async addUserSession(
    userId: number,
    sessionId: string,
  ): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}:${userId}`;
    const sessions = await this.getUserSessions(userId);
    sessions.push(sessionId);

    await this.redisService.setex(userSessionsKey, this.DEFAULT_TTL, sessions);
  }

  private async removeUserSession(
    userId: number,
    sessionId: string,
  ): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}:${userId}`;
    const sessions = await this.getUserSessions(userId);
    const filteredSessions = sessions.filter((id) => id !== sessionId);

    if (filteredSessions.length > 0) {
      await this.redisService.setex(
        userSessionsKey,
        this.DEFAULT_TTL,
        filteredSessions,
      );
    } else {
      await this.redisService.del(userSessionsKey);
    }
  }

  private async getUserSessions(userId: number): Promise<string[]> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}:${userId}`;
    const sessions = await this.redisService.get<string[]>(userSessionsKey);
    return sessions || [];
  }
}
