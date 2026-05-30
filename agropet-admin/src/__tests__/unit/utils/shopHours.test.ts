import { isHoliday, getStoreHoursForDate, getShopStatus } from '../../../utils/shopHours';

describe('shopHours Utility', () => {
  describe('isHoliday', () => {
    it('should identify fixed national holidays correctly', () => {
      expect(isHoliday(new Date('2026-01-01T12:00:00'))).toBe(true); // Ano Novo
      expect(isHoliday(new Date('2026-04-21T12:00:00'))).toBe(true); // Tiradentes
      expect(isHoliday(new Date('2026-05-01T12:00:00'))).toBe(true); // Dia do Trabalho
      expect(isHoliday(new Date('2026-09-07T12:00:00'))).toBe(true); // Independência
      expect(isHoliday(new Date('2026-10-12T12:00:00'))).toBe(true); // N. Sra. Aparecida
      expect(isHoliday(new Date('2026-11-02T12:00:00'))).toBe(true); // Finados
      expect(isHoliday(new Date('2026-11-15T12:00:00'))).toBe(true); // Proclamação da República
      expect(isHoliday(new Date('2026-12-25T12:00:00'))).toBe(true); // Natal
    });

    it('should return false for regular working days', () => {
      expect(isHoliday(new Date('2026-05-20T12:00:00'))).toBe(false); // regular Wednesday
    });

    it('should identify dynamic holidays based on Easter correctly (Year 2026)', () => {
      // In 2026, Easter Sunday is on April 5.
      // Good Friday is April 3.
      // Carnival Tuesday is Feb 17.
      // Corpus Christi is June 4.
      expect(isHoliday(new Date('2026-04-03T12:00:00'))).toBe(true); // Good Friday
      expect(isHoliday(new Date('2026-02-17T12:00:00'))).toBe(true); // Carnival Tuesday
      expect(isHoliday(new Date('2026-06-04T12:00:00'))).toBe(true); // Corpus Christi
    });
  });

  describe('getStoreHoursForDate', () => {
    it('should return closed on Sundays', () => {
      const sunday = new Date('2026-05-24T12:00:00'); // Sunday
      const hours = getStoreHoursForDate(sunday);
      expect(hours.isOpenToday).toBe(false);
      expect(hours.openHour).toBe(0);
      expect(hours.closeHour).toBe(0);
    });

    it('should return half day (8 to 12) on Saturdays and Holidays', () => {
      const saturday = new Date('2026-05-23T12:00:00'); // Saturday
      const holiday = new Date('2026-12-25T12:00:00'); // Christmas
      
      const hoursSat = getStoreHoursForDate(saturday);
      const hoursHol = getStoreHoursForDate(holiday);

      expect(hoursSat.isOpenToday).toBe(true);
      expect(hoursSat.openHour).toBe(8);
      expect(hoursSat.closeHour).toBe(12);

      expect(hoursHol.isOpenToday).toBe(true);
      expect(hoursHol.openHour).toBe(8);
      expect(hoursHol.closeHour).toBe(12);
    });

    it('should return full working hours (8 to 18) on weekdays', () => {
      const wednesday = new Date('2026-05-27T12:00:00');
      const hours = getStoreHoursForDate(wednesday);
      expect(hours.isOpenToday).toBe(true);
      expect(hours.openHour).toBe(8);
      expect(hours.closeHour).toBe(18);
    });
  });

  describe('getShopStatus', () => {
    it('should show closing countdown if shop is currently open', () => {
      const workingTime = new Date('2026-05-27T14:30:00'); // Wednesday 14:30 -> open until 18:00
      const status = getShopStatus(workingTime);
      expect(status.isOpen).toBe(true);
      expect(status.countdownText).toContain('A loja fechará em');
      expect(status.secondsRemaining).toBe(3.5 * 3600); // 3h 30m
    });

    it('should show opening countdown if shop is closed but opens later today', () => {
      const earlyMorning = new Date('2026-05-27T06:00:00'); // Wednesday 06:00 -> opens at 08:00
      const status = getShopStatus(earlyMorning);
      expect(status.isOpen).toBe(false);
      expect(status.countdownText).toContain('A loja abrirá em');
      expect(status.secondsRemaining).toBe(2 * 3600);
    });

    it('should show multi-day opening countdown if shop is closed and opens next day', () => {
      const saturdayAfternoon = new Date('2026-05-23T15:00:00'); // Saturday 15:00 -> closed, next opening is Monday 08:00 (since Sunday is closed)
      const status = getShopStatus(saturdayAfternoon);
      expect(status.isOpen).toBe(false);
      expect(status.countdownText).toContain('A loja abrirá em');
      expect(status.secondsRemaining).toBeGreaterThan(24 * 3600);
    });

    it('should show opening countdown if shop is closed but opens next day in less than 24 hours', () => {
      const wednesdayNight = new Date('2026-05-27T19:00:00'); // Wednesday 19:00 -> closed, next opening is Thursday 08:00
      const status = getShopStatus(wednesdayNight);
      expect(status.isOpen).toBe(false);
      expect(status.countdownText).toContain('A loja abrirá em');
      expect(status.secondsRemaining).toBe(13 * 3600); // 13 hours difference
    });

    it('should cover singular hours, minutes, and seconds for isOpenToday countdown', () => {
      // We want remaining time to be exactly 1 hour, 1 minute, 1 second (3661 seconds).
      // Closing time on Wednesday is 18:00 (64800s).
      // So we set time to 18:00 - 3661s = 61139s which is 16:58:59.
      const time = new Date('2026-05-27T16:58:59');
      const status = getShopStatus(time);
      expect(status.isOpen).toBe(true);
      expect(status.countdownText).toContain('A loja fechará em 01 hora . 01 minuto . 01 segundo');
    });

    it('should cover singular hours, minutes, and seconds for opening today countdown', () => {
      // We want remaining time to be exactly 1 hour, 1 minute, 1 second (3661 seconds).
      // Opening time on Wednesday is 08:00 (28800s).
      // So we set time to 08:00 - 3661s = 25139s which is 06:58:59.
      const time = new Date('2026-05-27T06:58:59');
      const status = getShopStatus(time);
      expect(status.isOpen).toBe(false);
      expect(status.countdownText).toContain('A loja abrirá em 01 hora . 01 minuto . 01 segundo');
    });

    it('should cover singular days, hours, minutes, and seconds for multi-day opening countdown', () => {
      // Next opening is Monday 08:00 (since Sunday is closed).
      // We want remaining time to be exactly 1 day, 1 hour, 1 minute, 1 second.
      // 1 day = 24h. Total remaining = 24h + 1h 1m 1s = 25h 1m 1s (90061s).
      // Target opening: Monday 2026-05-25 at 08:00:00.
      // Set now to Sunday 2026-05-24 at 06:58:59.
      const time = new Date('2026-05-24T06:58:59');
      const status = getShopStatus(time);
      expect(status.isOpen).toBe(false);
      expect(status.countdownText).toContain('A loja abrirá em 01 dia . 01 hora . 01 minuto . 01 segundo');
    });
  });
});

