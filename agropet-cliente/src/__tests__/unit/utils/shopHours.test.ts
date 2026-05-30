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

    it('should test singular branch conditions for shop open and close timers', () => {
      // 1. Open closing in exactly 1 hour, 1 minute, 1 second (closes at 18:00)
      const openTime = new Date('2026-05-27T16:58:59');
      const statusOpen = getShopStatus(openTime);
      expect(statusOpen.isOpen).toBe(true);
      expect(statusOpen.countdownText).toContain('1 hora');
      expect(statusOpen.countdownText).toContain('1 minuto');
      expect(statusOpen.countdownText).toContain('1 segundo');

      // 2. Closed opening in exactly 1 hour, 1 minute, 1 second (opens at 08:00)
      const closedTime = new Date('2026-05-27T06:58:59');
      const statusClosed = getShopStatus(closedTime);
      expect(statusClosed.isOpen).toBe(false);
      expect(statusClosed.countdownText).toContain('1 hora');
      expect(statusClosed.countdownText).toContain('1 minuto');
      expect(statusClosed.countdownText).toContain('1 segundo');

      // 3. Closed opening next day in exactly 1 day, 1 hour, 1 minute, 1 second (opens Thursday 08:00)
      const wednesdayEarly = new Date('2026-05-27T06:58:59');
      // Thursday 08:00 is exactly 25 hours, 1 minute, 1 second from Wednesday 06:58:59
      const statusNextDay = getShopStatus(wednesdayEarly);
      
      // Let's create a date that is closed for today but opens in exactly 25h 1m 1s
      // Actually if wednesdayEarly is Wed 06:58:59, getShopStatus(wednesdayEarly) returns earlyMorning case (opens today at 08:00 in 1h 1m 1s)
      // To get the multi-day case where it opens tomorrow (Thursday 08:00) and we check at Wednesday 06:58:59:
      // We can mock getStoreHoursForDate to return isOpenToday: false for today!
      // But we can also just find a time where:
      // It is Saturday 06:58:59 and Saturday is closed? No, Saturday is open 8 to 12.
      // Sunday is closed!
      // Sunday is 24/05/2026.
      // Next opening is Monday 25/05/2026 at 08:00.
      // So if now is Sunday 06:58:59, opens Monday 08:00:
      // Sunday 06:58:59 to Monday 08:00 is exactly 25 hours, 1 minute, 1 second!
      // Which is 1 day, 1 hour, 1 minute, 1 second!
      const sundayEarly = new Date('2026-05-24T06:58:59');
      const statusSunday = getShopStatus(sundayEarly);
      expect(statusSunday.isOpen).toBe(false);
      expect(statusSunday.countdownText).toContain('1 dia');
      expect(statusSunday.countdownText).toContain('1 hora');
      expect(statusSunday.countdownText).toContain('1 minuto');
      expect(statusSunday.countdownText).toContain('1 segundo');
    });
  });
});

