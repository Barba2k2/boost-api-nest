export class Streamer {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly points: number,
    public readonly platforms: string[],
    public readonly streamDays: string[],
    public readonly isOnline: boolean = false,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public addPoints(points: number): number {
    return this.points + points;
  }

  public addPlatform(platform: string): string[] {
    if (this.platforms.includes(platform)) {
      return this.platforms;
    }
    return [...this.platforms, platform];
  }

  public removePlatform(platform: string): string[] {
    return this.platforms.filter((p) => p !== platform);
  }

  public addStreamDay(day: string): string[] {
    if (this.streamDays.includes(day)) {
      return this.streamDays;
    }
    return [...this.streamDays, day];
  }

  public removeStreamDay(day: string): string[] {
    return this.streamDays.filter((d) => d !== day);
  }

  public setOnlineStatus(isOnline: boolean): Streamer {
    return new Streamer(
      this.id,
      this.userId,
      this.points,
      this.platforms,
      this.streamDays,
      isOnline,
      this.createdAt,
      this.updatedAt,
    );
  }
}
