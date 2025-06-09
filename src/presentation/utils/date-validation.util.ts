export class DateValidationUtil {
  /**
   * Converte uma string de data para Date object com validação
   * @param dateString Data no formato YYYY-MM-DD
   * @param timeString Horário a ser adicionado (padrão: '00:00:00.000Z')
   * @returns Date object válido
   * @throws Error se a data for inválida
   */
  static parseAndValidateDate(
    dateString: string,
    timeString: string = 'T00:00:00.000Z',
  ): Date {
    const date = new Date(dateString + timeString);
    if (isNaN(date.getTime())) {
      throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
    }
    return date;
  }

  /**
   * Converte e valida um par de datas (início e fim)
   * @param startDateString Data de início no formato YYYY-MM-DD
   * @param endDateString Data de fim no formato YYYY-MM-DD
   * @returns Objeto com startDate e endDate validadas
   * @throws Error se alguma data for inválida
   */
  static parseAndValidateDateRange(
    startDateString: string,
    endDateString: string,
  ): { startDate: Date; endDate: Date } {
    const startDate = this.parseAndValidateDate(
      startDateString,
      'T00:00:00.000Z',
    );
    const endDate = this.parseAndValidateDate(endDateString, 'T23:59:59.999Z');

    if (startDate > endDate) {
      throw new Error('Data de início não pode ser posterior à data de fim.');
    }

    return { startDate, endDate };
  }

  /**
   * Calcula as datas da semana atual (segunda a sábado)
   * Se for domingo, pega a semana anterior
   * @returns Objeto com startDate e endDate da semana
   */
  static getCurrentWeekDates(): { startDate: Date; endDate: Date } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado

    // Se for domingo (0), voltar para a semana anterior
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Segunda-feira da semana
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);

    // Sábado da semana
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5); // +5 dias = sábado
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * Converte uma data opcional para Date object ou usa a semana atual
   * @param startDateString Data de início opcional
   * @param endDateString Data de fim opcional
   * @returns Objeto com startDate e endDate
   */
  static parseOptionalDateRangeOrCurrentWeek(
    startDateString?: string,
    endDateString?: string,
  ): { startDate: Date; endDate: Date } {
    if (!startDateString || !endDateString) {
      return this.getCurrentWeekDates();
    }
    return this.parseAndValidateDateRange(startDateString, endDateString);
  }
}
