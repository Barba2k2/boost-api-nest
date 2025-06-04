import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketsService } from './websockets.service';

describe('WebsocketsService', () => {
  let service: WebsocketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebsocketsService],
    }).compile();

    service = module.get<WebsocketsService>(WebsocketsService);
  });

  describe('WebsocketsService', () => {
    it('deve ser definido', () => {
      expect(service).toBeDefined();
    });

    it('deve ter um scheduleUpdates$ observable', () => {
      expect(service.scheduleUpdates$).toBeDefined();
      expect(typeof service.scheduleUpdates$.subscribe).toBe('function');
    });

    it('deve inicializar scheduleUpdates$ com null', (done) => {
      service.scheduleUpdates$.subscribe((value) => {
        expect(value).toBeNull();
        done();
      });
    });

    it('deve notificar atualizações de schedule', (done) => {
      // Arrange
      const testData = { scheduleId: 1, action: 'update' };
      const expectedNotification = {
        type: 'SCHEDULE_UPDATE',
        data: testData,
      };

      // Act & Assert
      service.scheduleUpdates$.subscribe((value) => {
        if (value !== null) {
          expect(value).toEqual(expectedNotification);
          expect(value.type).toBe('SCHEDULE_UPDATE');
          expect(value.data).toEqual(testData);
          done();
        }
      });

      service.notifyScheduleUpdate(testData);
    });

    it('deve permitir múltiplas notificações', () => {
      // Arrange
      const notifications: any[] = [];
      const testData1 = { scheduleId: 1, action: 'create' };
      const testData2 = { scheduleId: 2, action: 'delete' };

      service.scheduleUpdates$.subscribe((value) => {
        if (value !== null) {
          notifications.push(value);
        }
      });

      // Act
      service.notifyScheduleUpdate(testData1);
      service.notifyScheduleUpdate(testData2);

      // Assert
      expect(notifications).toHaveLength(2);
      expect(notifications[0].data).toEqual(testData1);
      expect(notifications[1].data).toEqual(testData2);
    });

    it('deve manter o último valor emitido (BehaviorSubject)', (done) => {
      // Arrange
      const testData = { scheduleId: 123, action: 'update' };

      // Act - Primeiro emite um valor
      service.notifyScheduleUpdate(testData);

      // Assert - Novo subscriber deve receber o último valor
      setTimeout(() => {
        service.scheduleUpdates$.subscribe((value) => {
          expect(value).toBeDefined();
          expect(value!.data).toEqual(testData);
          done();
        });
      }, 10);
    });

    it('deve aceitar diferentes tipos de dados', () => {
      // Arrange
      const stringData = 'test string';
      const objectData = { complex: { nested: 'object' } };
      const arrayData = [1, 2, 3];
      const receivedValues: any[] = [];

      service.scheduleUpdates$.subscribe((value) => {
        if (value !== null) {
          receivedValues.push(value.data);
        }
      });

      // Act
      service.notifyScheduleUpdate(stringData);
      service.notifyScheduleUpdate(objectData);
      service.notifyScheduleUpdate(arrayData);

      // Assert
      expect(receivedValues).toHaveLength(3);
      expect(receivedValues[0]).toBe(stringData);
      expect(receivedValues[1]).toEqual(objectData);
      expect(receivedValues[2]).toEqual(arrayData);
    });

    it('deve sempre encapsular dados no formato correto', () => {
      // Arrange
      const testData = { test: 'data' };
      let receivedNotification: any;

      service.scheduleUpdates$.subscribe((value) => {
        if (value !== null) {
          receivedNotification = value;
        }
      });

      // Act
      service.notifyScheduleUpdate(testData);

      // Assert
      expect(receivedNotification).toHaveProperty('type', 'SCHEDULE_UPDATE');
      expect(receivedNotification).toHaveProperty('data', testData);
      expect(Object.keys(receivedNotification)).toEqual(['type', 'data']);
    });
  });
});
