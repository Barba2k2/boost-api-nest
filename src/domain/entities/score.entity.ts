export class Score {
  constructor(
    public readonly id: number,
    public readonly streamerId: number,
    public readonly points: number,
    public readonly reason: string,
    public readonly createdAt?: Date,
  ) {}

  public isPositive(): boolean {
    return this.points > 0;
  }

  public isNegative(): boolean {
    return this.points < 0;
  }

  public getAbsolutePoints(): number {
    return Math.abs(this.points);
  }
}
