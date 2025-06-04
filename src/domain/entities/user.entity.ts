export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class User {
  constructor(
    public readonly id: number,
    public readonly nickname: string,
    public readonly password: string,
    public readonly role: UserRole,
    public readonly refreshToken?: string,
    public readonly webToken?: string,
    public readonly windowsToken?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public isUser(): boolean {
    return this.role === UserRole.USER;
  }

  public isAssistant(): boolean {
    return this.role === UserRole.ASSISTANT;
  }

  public canCreateStreamer(): boolean {
    return this.role === UserRole.USER || this.role === UserRole.ADMIN;
  }
}
