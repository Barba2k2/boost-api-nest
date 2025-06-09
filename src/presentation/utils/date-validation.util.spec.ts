import { DateValidationUtil } from './date-validation.util';

describe('DateValidationUtil', () => {
  describe('parseAndValidateDate', () => {
    it('deve converter string de data válida para Date object', () => {
      // Arrange
      const dateString = '2024-01-15';

      // Act
      const result = DateValidationUtil.parseAndValidateDate(dateString);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    });

    it('deve usar horário padrão 00:00:00.000Z quando não especificado', () => {
      // Arrange
      const dateString = '2024-06-10';

      // Act
      const result = DateValidationUtil.parseAndValidateDate(dateString);

      // Assert
      expect(result.toISOString()).toBe('2024-06-10T00:00:00.000Z');
    });

    it('deve usar horário personalizado quando especificado', () => {
      // Arrange
      const dateString = '2024-06-10';
      const timeString = 'T23:59:59.999Z';

      // Act
      const result = DateValidationUtil.parseAndValidateDate(
        dateString,
        timeString,
      );

      // Assert
      expect(result.toISOString()).toBe('2024-06-10T23:59:59.999Z');
    });

    it('deve lançar erro para string totalmente inválida', () => {
      // Arrange
      const invalidDate = 'data-inválida';

      // Act & Assert
      expect(() => {
        DateValidationUtil.parseAndValidateDate(invalidDate);
      }).toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });

    it('deve lançar erro para formato brasileiro', () => {
      // Arrange
      const wrongFormat = '15/01/2024';

      // Act & Assert
      expect(() => {
        DateValidationUtil.parseAndValidateDate(wrongFormat);
      }).toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });

    it('deve validar ano bissexto corretamente', () => {
      // Arrange
      const leapYearDate = '2024-02-29';

      // Act
      const result = DateValidationUtil.parseAndValidateDate(leapYearDate);

      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-02-29T00:00:00.000Z');
    });
  });

  describe('parseAndValidateDateRange', () => {
    it('deve converter par de datas válidas', () => {
      // Arrange
      const startDateString = '2024-01-01';
      const endDateString = '2024-01-31';

      // Act
      const result = DateValidationUtil.parseAndValidateDateRange(
        startDateString,
        endDateString,
      );

      // Assert
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(result.endDate.toISOString()).toBe('2024-01-31T23:59:59.999Z');
    });

    it('deve aceitar datas iguais', () => {
      // Arrange
      const dateString = '2024-06-10';

      // Act
      const result = DateValidationUtil.parseAndValidateDateRange(
        dateString,
        dateString,
      );

      // Assert
      expect(result.startDate.toISOString()).toBe('2024-06-10T00:00:00.000Z');
      expect(result.endDate.toISOString()).toBe('2024-06-10T23:59:59.999Z');
      expect(result.startDate.getTime()).toBeLessThan(result.endDate.getTime());
    });

    it('deve lançar erro quando data de início é posterior à data de fim', () => {
      // Arrange
      const startDateString = '2024-06-15';
      const endDateString = '2024-06-10';

      // Act & Assert
      expect(() => {
        DateValidationUtil.parseAndValidateDateRange(
          startDateString,
          endDateString,
        );
      }).toThrow('Data de início não pode ser posterior à data de fim.');
    });

    it('deve lançar erro para data de início inválida', () => {
      // Arrange
      const invalidStartDate = 'data-inválida';
      const validEndDate = '2024-06-10';

      // Act & Assert
      expect(() => {
        DateValidationUtil.parseAndValidateDateRange(
          invalidStartDate,
          validEndDate,
        );
      }).toThrow('Data inválida. Use o formato YYYY-MM-DD.');
    });

    it('deve funcionar com range de um ano inteiro', () => {
      // Arrange
      const startDateString = '2024-01-01';
      const endDateString = '2024-12-31';

      // Act
      const result = DateValidationUtil.parseAndValidateDateRange(
        startDateString,
        endDateString,
      );

      // Assert
      expect(result.startDate.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(result.endDate.toISOString()).toBe('2024-12-31T23:59:59.999Z');
    });
  });

  describe('getCurrentWeekDates', () => {
    it('deve retornar datas da semana (segunda a sábado)', () => {
      // Act
      const result = DateValidationUtil.getCurrentWeekDates();

      // Assert
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate.getDay()).toBe(1); // Segunda-feira
      expect(result.endDate.getDay()).toBe(6); // Sábado
      expect(result.endDate.getTime()).toBeGreaterThan(
        result.startDate.getTime(),
      );
    });

    it('deve definir horários corretos (00:00:00 início, 23:59:59 fim)', () => {
      // Act
      const result = DateValidationUtil.getCurrentWeekDates();

      // Assert
      expect(result.startDate.getHours()).toBe(0);
      expect(result.startDate.getMinutes()).toBe(0);
      expect(result.startDate.getSeconds()).toBe(0);
      expect(result.startDate.getMilliseconds()).toBe(0);

      expect(result.endDate.getHours()).toBe(23);
      expect(result.endDate.getMinutes()).toBe(59);
      expect(result.endDate.getSeconds()).toBe(59);
      expect(result.endDate.getMilliseconds()).toBe(999);
    });

    it('deve sempre retornar 6 dias de diferença (segunda a sábado)', () => {
      // Act
      const result = DateValidationUtil.getCurrentWeekDates();

      // Assert
      const diffInMs = result.endDate.getTime() - result.startDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      expect(Math.floor(diffInDays)).toBe(5); // 5 dias completos + parte do 6º dia
    });
  });

  describe('parseOptionalDateRangeOrCurrentWeek', () => {
    it('deve usar datas fornecidas quando ambas estão presentes', () => {
      // Arrange
      const startDateString = '2024-06-01';
      const endDateString = '2024-06-10';

      // Act
      const result = DateValidationUtil.parseOptionalDateRangeOrCurrentWeek(
        startDateString,
        endDateString,
      );

      // Assert
      expect(result.startDate.toISOString()).toBe('2024-06-01T00:00:00.000Z');
      expect(result.endDate.toISOString()).toBe('2024-06-10T23:59:59.999Z');
    });

    it('deve usar semana atual quando startDate não for fornecida', () => {
      // Act
      const result = DateValidationUtil.parseOptionalDateRangeOrCurrentWeek(
        undefined,
        '2024-06-10',
      );

      // Assert
      expect(result.startDate.getDay()).toBe(1); // Segunda-feira
      expect(result.endDate.getDay()).toBe(6); // Sábado
    });

    it('deve usar semana atual quando endDate não for fornecida', () => {
      // Act
      const result = DateValidationUtil.parseOptionalDateRangeOrCurrentWeek(
        '2024-06-01',
        undefined,
      );

      // Assert
      expect(result.startDate.getDay()).toBe(1); // Segunda-feira
      expect(result.endDate.getDay()).toBe(6); // Sábado
    });

    it('deve usar semana atual quando ambas as datas não forem fornecidas', () => {
      // Act
      const result = DateValidationUtil.parseOptionalDateRangeOrCurrentWeek();

      // Assert
      expect(result.startDate.getDay()).toBe(1); // Segunda-feira
      expect(result.endDate.getDay()).toBe(6); // Sábado
    });

    it('deve usar semana atual para strings vazias', () => {
      // Act
      const result = DateValidationUtil.parseOptionalDateRangeOrCurrentWeek(
        '',
        '',
      );

      // Assert
      expect(result.startDate.getDay()).toBe(1); // Segunda-feira
      expect(result.endDate.getDay()).toBe(6); // Sábado
    });

    it('deve lançar erro quando data de início for posterior à data de fim', () => {
      // Arrange
      const startDateString = '2024-06-15';
      const endDateString = '2024-06-10';

      // Act & Assert
      expect(() => {
        DateValidationUtil.parseOptionalDateRangeOrCurrentWeek(
          startDateString,
          endDateString,
        );
      }).toThrow('Data de início não pode ser posterior à data de fim.');
    });
  });

  describe('edge cases', () => {
    it('deve funcionar corretamente na virada do ano', () => {
      // Arrange
      const startDateString = '2023-12-31';
      const endDateString = '2024-01-01';

      // Act
      const result = DateValidationUtil.parseAndValidateDateRange(
        startDateString,
        endDateString,
      );

      // Assert
      expect(result.startDate.toISOString()).toBe('2023-12-31T00:00:00.000Z');
      expect(result.endDate.toISOString()).toBe('2024-01-01T23:59:59.999Z');
    });

    it('deve manter consistência de timezone', () => {
      // Arrange
      const dateString = '2024-06-10';

      // Act
      const result1 = DateValidationUtil.parseAndValidateDate(dateString);
      const result2 = DateValidationUtil.parseAndValidateDate(dateString);

      // Assert
      expect(result1.getTime()).toBe(result2.getTime());
    });

    it('deve validar formato ISO completo', () => {
      // Arrange
      const date1 = DateValidationUtil.parseAndValidateDate(
        '2024-01-01',
        'T00:00:00.000Z',
      );
      const date2 = DateValidationUtil.parseAndValidateDate(
        '2024-01-01',
        'T23:59:59.999Z',
      );

      // Act & Assert
      expect(date1.getTime()).toBeLessThan(date2.getTime());
      expect(date2.getTime() - date1.getTime()).toBe(86399999); // Quase 24h em ms
    });
  });
});
