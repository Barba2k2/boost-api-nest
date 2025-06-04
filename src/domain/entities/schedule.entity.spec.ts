import { Schedule } from './schedule.entity';

describe('Schedule Entity', () => {
  const mockScheduleData = {
    id: 1,
    streamerId: 1,
    day: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('constructor', () => {
    it('deve criar uma instância de Schedule com todos os parâmetros', () => {
      const schedule = new Schedule(
        mockScheduleData.id,
        mockScheduleData.streamerId,
        mockScheduleData.day,
        mockScheduleData.startTime,
        mockScheduleData.endTime,
        mockScheduleData.isActive,
        mockScheduleData.createdAt,
        mockScheduleData.updatedAt,
      );

      expect(schedule.id).toBe(mockScheduleData.id);
      expect(schedule.streamerId).toBe(mockScheduleData.streamerId);
      expect(schedule.day).toBe(mockScheduleData.day);
      expect(schedule.startTime).toBe(mockScheduleData.startTime);
      expect(schedule.endTime).toBe(mockScheduleData.endTime);
      expect(schedule.isActive).toBe(mockScheduleData.isActive);
      expect(schedule.createdAt).toBe(mockScheduleData.createdAt);
      expect(schedule.updatedAt).toBe(mockScheduleData.updatedAt);
    });

    it('deve criar uma instância de Schedule sem createdAt e updatedAt', () => {
      const schedule = new Schedule(
        mockScheduleData.id,
        mockScheduleData.streamerId,
        mockScheduleData.day,
        mockScheduleData.startTime,
        mockScheduleData.endTime,
        mockScheduleData.isActive,
      );

      expect(schedule.createdAt).toBeUndefined();
      expect(schedule.updatedAt).toBeUndefined();
    });
  });

  describe('isTimeConflict', () => {
    let schedule: Schedule;

    beforeEach(() => {
      schedule = new Schedule(1, 1, 'Monday', '09:00', '11:00', true);
    });

    it('deve retornar true quando há conflito total (novo horário dentro do atual)', () => {
      const result = schedule.isTimeConflict('09:30', '10:30');
      expect(result).toBe(true);
    });

    it('deve retornar true quando há conflito parcial (início dentro do horário atual)', () => {
      const result = schedule.isTimeConflict('10:00', '12:00');
      expect(result).toBe(true);
    });

    it('deve retornar true quando há conflito parcial (fim dentro do horário atual)', () => {
      const result = schedule.isTimeConflict('08:00', '10:00');
      expect(result).toBe(true);
    });

    it('deve retornar true quando o novo horário engloba o atual', () => {
      const result = schedule.isTimeConflict('08:00', '12:00');
      expect(result).toBe(true);
    });

    it('deve retornar false quando não há conflito (horário anterior)', () => {
      const result = schedule.isTimeConflict('07:00', '08:59');
      expect(result).toBe(false);
    });

    it('deve retornar false quando não há conflito (horário posterior)', () => {
      const result = schedule.isTimeConflict('11:01', '12:00');
      expect(result).toBe(false);
    });

    it('deve retornar false quando o horário termina exatamente quando o atual começa', () => {
      const result = schedule.isTimeConflict('07:00', '09:00');
      expect(result).toBe(false);
    });

    it('deve retornar false quando o horário começa exatamente quando o atual termina', () => {
      const result = schedule.isTimeConflict('11:00', '12:00');
      expect(result).toBe(false);
    });
  });

  describe('activate', () => {
    it('deve retornar um novo Schedule com isActive = true', () => {
      const inactiveSchedule = new Schedule(
        1,
        1,
        'Monday',
        '09:00',
        '11:00',
        false,
      );
      const activatedSchedule = inactiveSchedule.activate();

      expect(activatedSchedule).not.toBe(inactiveSchedule);
      expect(activatedSchedule.isActive).toBe(true);
      expect(activatedSchedule.id).toBe(inactiveSchedule.id);
      expect(activatedSchedule.streamerId).toBe(inactiveSchedule.streamerId);
      expect(activatedSchedule.day).toBe(inactiveSchedule.day);
      expect(activatedSchedule.startTime).toBe(inactiveSchedule.startTime);
      expect(activatedSchedule.endTime).toBe(inactiveSchedule.endTime);
    });

    it('deve preservar createdAt e updatedAt ao ativar', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const schedule = new Schedule(
        1,
        1,
        'Monday',
        '09:00',
        '11:00',
        false,
        createdAt,
        updatedAt,
      );

      const activatedSchedule = schedule.activate();

      expect(activatedSchedule.createdAt).toBe(createdAt);
      expect(activatedSchedule.updatedAt).toBe(updatedAt);
    });
  });

  describe('deactivate', () => {
    it('deve retornar um novo Schedule com isActive = false', () => {
      const activeSchedule = new Schedule(
        1,
        1,
        'Monday',
        '09:00',
        '11:00',
        true,
      );
      const deactivatedSchedule = activeSchedule.deactivate();

      expect(deactivatedSchedule).not.toBe(activeSchedule);
      expect(deactivatedSchedule.isActive).toBe(false);
      expect(deactivatedSchedule.id).toBe(activeSchedule.id);
      expect(deactivatedSchedule.streamerId).toBe(activeSchedule.streamerId);
      expect(deactivatedSchedule.day).toBe(activeSchedule.day);
      expect(deactivatedSchedule.startTime).toBe(activeSchedule.startTime);
      expect(deactivatedSchedule.endTime).toBe(activeSchedule.endTime);
    });

    it('deve preservar createdAt e updatedAt ao desativar', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const schedule = new Schedule(
        1,
        1,
        'Monday',
        '09:00',
        '11:00',
        true,
        createdAt,
        updatedAt,
      );

      const deactivatedSchedule = schedule.deactivate();

      expect(deactivatedSchedule.createdAt).toBe(createdAt);
      expect(deactivatedSchedule.updatedAt).toBe(updatedAt);
    });
  });

  describe('convertTimeToMinutes (método privado testado indiretamente)', () => {
    it('deve converter horários corretamente através do isTimeConflict', () => {
      const schedule = new Schedule(1, 1, 'Monday', '01:30', '02:45', true);

      // Testando se a conversão está funcionando corretamente
      // 01:30 = 90 minutos, 02:45 = 165 minutos
      // Novo horário: 02:00 = 120 minutos, 03:00 = 180 minutos
      // Deve haver conflito pois 120 < 165 e 180 > 90
      const result = schedule.isTimeConflict('02:00', '03:00');
      expect(result).toBe(true);
    });

    it('deve lidar com horários de meia-noite', () => {
      const schedule = new Schedule(1, 1, 'Monday', '00:00', '01:00', true);

      const result = schedule.isTimeConflict('00:30', '01:30');
      expect(result).toBe(true);
    });

    it('deve lidar com horários de final do dia', () => {
      const schedule = new Schedule(1, 1, 'Monday', '23:00', '23:59', true);

      const result = schedule.isTimeConflict('22:30', '23:30');
      expect(result).toBe(true);
    });
  });
});
