import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface SocketConnection {
  socketId: string;
  userId?: number;
  connectionTime: number;
  lastActivity: number;
  metadata?: {
    userAgent?: string;
    ip?: string;
    room?: string;
  };
}

export interface SocketRoom {
  roomId: string;
  connections: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class WebSocketCacheService {
  private readonly SOCKET_PREFIX = 'socket';
  private readonly ROOM_PREFIX = 'room';
  private readonly USER_SOCKETS_PREFIX = 'user_sockets';
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 horas

  constructor(private readonly redisService: RedisService) {}

  /**
   * Registra uma nova conexão WebSocket
   */
  async registerConnection(
    socketId: string,
    userId?: number,
    metadata?: SocketConnection['metadata'],
  ): Promise<void> {
    const connection: SocketConnection = {
      socketId,
      userId,
      connectionTime: Date.now(),
      lastActivity: Date.now(),
      metadata,
    };

    // Armazenar dados da conexão
    await this.redisService.setex(
      `${this.SOCKET_PREFIX}:${socketId}`,
      this.DEFAULT_TTL,
      connection,
    );

    // Se há usuário associado, mapear usuário -> sockets
    if (userId) {
      await this.addUserSocket(userId, socketId);
    }
  }

  /**
   * Remove uma conexão WebSocket
   */
  async removeConnection(socketId: string): Promise<void> {
    // Buscar dados da conexão antes de remover
    const connection = await this.getConnection(socketId);

    if (connection) {
      // Remover de todas as salas
      await this.removeFromAllRooms(socketId);

      // Remover do mapeamento de usuário
      if (connection.userId) {
        await this.removeUserSocket(connection.userId, socketId);
      }
    }

    // Remover a conexão
    await this.redisService.del(`${this.SOCKET_PREFIX}:${socketId}`);
  }

  /**
   * Busca dados de uma conexão
   */
  async getConnection(socketId: string): Promise<SocketConnection | null> {
    const connection = await this.redisService.get<SocketConnection>(
      `${this.SOCKET_PREFIX}:${socketId}`,
    );
    return connection || null;
  }

  /**
   * Atualiza a última atividade de uma conexão
   */
  async updateActivity(socketId: string): Promise<void> {
    const connection = await this.getConnection(socketId);
    if (connection) {
      connection.lastActivity = Date.now();
      await this.redisService.setex(
        `${this.SOCKET_PREFIX}:${socketId}`,
        this.DEFAULT_TTL,
        connection,
      );
    }
  }

  /**
   * Busca todas as conexões de um usuário
   */
  async getUserConnections(userId: number): Promise<SocketConnection[]> {
    const socketIds = await this.getUserSockets(userId);
    const connectionPromises = socketIds.map((socketId) =>
      this.getConnection(socketId),
    );

    const connections = await Promise.all(connectionPromises);
    return connections.filter((conn) => conn !== null) as SocketConnection[];
  }

  /**
   * Adiciona um socket a uma sala
   */
  async joinRoom(socketId: string, roomId: string): Promise<void> {
    const roomKey = `${this.ROOM_PREFIX}:${roomId}`;
    const room = (await this.getRoom(roomId)) || {
      roomId,
      connections: [],
    };

    if (!room.connections.includes(socketId)) {
      room.connections.push(socketId);
      await this.redisService.setex(roomKey, this.DEFAULT_TTL, room);
    }

    // Armazenar referência inversa (socket -> salas)
    await this.addSocketRoom(socketId, roomId);
  }

  /**
   * Remove um socket de uma sala
   */
  async leaveRoom(socketId: string, roomId: string): Promise<void> {
    const roomKey = `${this.ROOM_PREFIX}:${roomId}`;
    const room = await this.getRoom(roomId);

    if (room) {
      room.connections = room.connections.filter((id) => id !== socketId);

      if (room.connections.length === 0) {
        // Sala vazia, remover
        await this.redisService.del(roomKey);
      } else {
        await this.redisService.setex(roomKey, this.DEFAULT_TTL, room);
      }
    }

    // Remover referência inversa
    await this.removeSocketRoom(socketId, roomId);
  }

  /**
   * Busca dados de uma sala
   */
  async getRoom(roomId: string): Promise<SocketRoom | null> {
    const room = await this.redisService.get<SocketRoom>(
      `${this.ROOM_PREFIX}:${roomId}`,
    );
    return room || null;
  }

  /**
   * Lista todas as conexões em uma sala
   */
  async getRoomConnections(roomId: string): Promise<SocketConnection[]> {
    const room = await this.getRoom(roomId);
    if (!room) return [];

    const connectionPromises = room.connections.map((socketId) =>
      this.getConnection(socketId),
    );

    const connections = await Promise.all(connectionPromises);
    return connections.filter((conn) => conn !== null) as SocketConnection[];
  }

  /**
   * Conta conexões ativas
   */
  async getActiveConnectionsCount(): Promise<number> {
    // Implementação simplificada - em produção usaria SCAN
    return 0; // Placeholder
  }

  /**
   * Lista todas as salas ativas
   */
  async getActiveRooms(): Promise<string[]> {
    // Implementação simplificada - em produção usaria SCAN
    return []; // Placeholder
  }

  /**
   * Remove socket de todas as salas
   */
  private async removeFromAllRooms(socketId: string): Promise<void> {
    const rooms = await this.getSocketRooms(socketId);
    const removePromises = rooms.map((roomId) =>
      this.leaveRoom(socketId, roomId),
    );
    await Promise.all(removePromises);
  }

  /**
   * Mapeia usuário -> sockets
   */
  private async addUserSocket(userId: number, socketId: string): Promise<void> {
    const userSocketsKey = `${this.USER_SOCKETS_PREFIX}:${userId}`;
    const sockets = await this.getUserSockets(userId);

    if (!sockets.includes(socketId)) {
      sockets.push(socketId);
      await this.redisService.setex(userSocketsKey, this.DEFAULT_TTL, sockets);
    }
  }

  /**
   * Remove mapeamento usuário -> socket
   */
  private async removeUserSocket(
    userId: number,
    socketId: string,
  ): Promise<void> {
    const userSocketsKey = `${this.USER_SOCKETS_PREFIX}:${userId}`;
    const sockets = await this.getUserSockets(userId);
    const filteredSockets = sockets.filter((id) => id !== socketId);

    if (filteredSockets.length > 0) {
      await this.redisService.setex(
        userSocketsKey,
        this.DEFAULT_TTL,
        filteredSockets,
      );
    } else {
      await this.redisService.del(userSocketsKey);
    }
  }

  /**
   * Busca sockets de um usuário
   */
  private async getUserSockets(userId: number): Promise<string[]> {
    const userSocketsKey = `${this.USER_SOCKETS_PREFIX}:${userId}`;
    return (await this.redisService.get<string[]>(userSocketsKey)) || [];
  }

  /**
   * Adiciona referência socket -> sala
   */
  private async addSocketRoom(socketId: string, roomId: string): Promise<void> {
    const socketRoomsKey = `${this.SOCKET_PREFIX}:${socketId}:rooms`;
    const rooms = await this.getSocketRooms(socketId);

    if (!rooms.includes(roomId)) {
      rooms.push(roomId);
      await this.redisService.setex(socketRoomsKey, this.DEFAULT_TTL, rooms);
    }
  }

  /**
   * Remove referência socket -> sala
   */
  private async removeSocketRoom(
    socketId: string,
    roomId: string,
  ): Promise<void> {
    const socketRoomsKey = `${this.SOCKET_PREFIX}:${socketId}:rooms`;
    const rooms = await this.getSocketRooms(socketId);
    const filteredRooms = rooms.filter((id) => id !== roomId);

    if (filteredRooms.length > 0) {
      await this.redisService.setex(
        socketRoomsKey,
        this.DEFAULT_TTL,
        filteredRooms,
      );
    } else {
      await this.redisService.del(socketRoomsKey);
    }
  }

  /**
   * Busca salas de um socket
   */
  private async getSocketRooms(socketId: string): Promise<string[]> {
    const socketRoomsKey = `${this.SOCKET_PREFIX}:${socketId}:rooms`;
    return (await this.redisService.get<string[]>(socketRoomsKey)) || [];
  }
}
