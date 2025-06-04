export class Schedule {
  constructor(
    public readonly id: number,
    public readonly streamerId: number,
    public readonly day: string,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly isActive: boolean,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public isTimeConflict(startTime: string, endTime: string): boolean {
    // Lógica para verificar conflito de horários
    const currentStart = this.convertTimeToMinutes(this.startTime);
    const currentEnd = this.convertTimeToMinutes(this.endTime);
    const newStart = this.convertTimeToMinutes(startTime);
    const newEnd = this.convertTimeToMinutes(endTime);

    return newStart < currentEnd && newEnd > currentStart;
  }

  public activate(): Schedule {
    return new Schedule(
      this.id,
      this.streamerId,
      this.day,
      this.startTime,
      this.endTime,
      true,
      this.createdAt,
      this.updatedAt,
    );
  }

  public deactivate(): Schedule {
    return new Schedule(
      this.id,
      this.streamerId,
      this.day,
      this.startTime,
      this.endTime,
      false,
      this.createdAt,
      this.updatedAt,
    );
  }

  private convertTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
