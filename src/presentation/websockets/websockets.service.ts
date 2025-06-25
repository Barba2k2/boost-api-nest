import { Injectable } from '@nestjs/common';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class WebsocketsService {
  private scheduleUpdates = new BehaviorSubject<any>(null);

  scheduleUpdates$ = this.scheduleUpdates.asObservable();

  notifyScheduleUpdate(data: any) {
    this.scheduleUpdates.next({
      type: 'SCHEDULE_UPDATE',
      data,
    });
  }
}
