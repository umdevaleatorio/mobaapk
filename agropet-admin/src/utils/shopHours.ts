/**
 * Algoritmo astronômico para calcular o Domingo de Páscoa (Meeus/Jones/Butcher)
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Verifica se uma data é feriado nacional brasileiro (fixo ou móvel)
 */
export function isHoliday(date: Date): boolean {
  const day = date.getDate();
  const month = date.getMonth() + 1; // 1-indexed
  const year = date.getFullYear();

  // Feriados Nacionais Fixos no Brasil
  const fixedHolidays = [
    { day: 1, month: 1 },   // Ano Novo / Confraternização Universal
    { day: 21, month: 4 },  // Tiradentes
    { day: 1, month: 5 },   // Dia do Trabalho
    { day: 7, month: 9 },   // Dia da Independência do Brasil
    { day: 12, month: 10 }, // Nossa Senhora Aparecida (Padroeira do Brasil)
    { day: 2, month: 11 },  // Finados
    { day: 15, month: 11 }, // Proclamação da República
    { day: 25, month: 12 }, // Natal
  ];

  const isFixed = fixedHolidays.some(h => h.day === day && h.month === month);
  if (isFixed) return true;

  // Cálculo de Feriados Móveis baseados na Páscoa
  const easter = getEasterDate(year);

  // Sexta-feira Santa (2 dias antes da Páscoa)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);

  // Carnaval (Terça-feira, 47 dias antes da Páscoa)
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 47);

  // Corpus Christi (60 dias após a Páscoa)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);

  const checkSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  return (
    checkSameDay(date, goodFriday) ||
    checkSameDay(date, corpusChristi) ||
    checkSameDay(date, carnival)
  );
}

/**
 * Obtém as configurações de funcionamento da loja para um determinado dia
 */
export function getStoreHoursForDate(date: Date) {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado, 1-5 = Segunda-Sexta
  const isSun = dayOfWeek === 0;
  const isSat = dayOfWeek === 6;
  const isHol = isHoliday(date);

  if (isSun) {
    return { isOpenToday: false, openHour: 0, closeHour: 0 };
  }
  if (isSat || isHol) {
    return { isOpenToday: true, openHour: 8, closeHour: 12 };
  }
  return { isOpenToday: true, openHour: 8, closeHour: 18 };
}

export interface ShopStatus {
  isOpen: boolean;
  isSundayOrHoliday: boolean;
  countdownText: string;
  secondsRemaining: number;
}

/**
 * Retorna o status de abertura da loja, indicando se está aberta,
 * se é domingo/feriado e a mensagem de contagem regressiva formatada.
 */
export function getShopStatus(now: Date): ShopStatus {
  const { isOpenToday, openHour, closeHour } = getStoreHoursForDate(now);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();

  const nowInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;
  const openInSeconds = openHour * 3600;
  const closeInSeconds = closeHour * 3600;

  const dayOfWeek = now.getDay();
  const isSun = dayOfWeek === 0;
  const isHol = isHoliday(now);
  const isSundayOrHoliday = isSun || isHol;

  const pad = (num: number) => String(num).padStart(2, '0');

  if (isOpenToday && nowInSeconds >= openInSeconds && nowInSeconds < closeInSeconds) {
    // Loja aberta! Contador regressivo de fechamento
    const secondsRemaining = closeInSeconds - nowInSeconds;
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;

    const hoursText = hours === 1 ? 'hora' : 'horas';
    const minutesText = minutes === 1 ? 'minuto' : 'minutos';
    const secondsText = seconds === 1 ? 'segundo' : 'segundos';

    return {
      isOpen: true,
      isSundayOrHoliday: false,
      countdownText: `A loja fechará em ${pad(hours)} ${hoursText} . ${pad(minutes)} ${minutesText} . ${pad(seconds)} ${secondsText}`,
      secondsRemaining
    };
  } else {
    // Loja fechada! Vamos encontrar a próxima reabertura
    // Se hoje é dia de abertura, mas ainda não abriu (está antes das 08h)
    if (isOpenToday && nowInSeconds < openInSeconds) {
      const secondsRemaining = openInSeconds - nowInSeconds;
      const hours = Math.floor(secondsRemaining / 3600);
      const minutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;

      const hoursText = hours === 1 ? 'hora' : 'horas';
      const minutesText = minutes === 1 ? 'minuto' : 'minutos';
      const secondsText = seconds === 1 ? 'segundo' : 'segundos';

      return {
        isOpen: false,
        isSundayOrHoliday,
        countdownText: `A loja abrirá em ${pad(hours)} ${hoursText} . ${pad(minutes)} ${minutesText} . ${pad(seconds)} ${secondsText}`,
        secondsRemaining
      };
    }

    // Caso contrário, ela abrirá em algum dia no futuro (dias seguintes)
    let targetDate = new Date(now);
    let targetHours = getStoreHoursForDate(targetDate);
    let daysDiff = 0;

    while (true) {
      daysDiff++;
      targetDate.setDate(targetDate.getDate() + 1);
      targetHours = getStoreHoursForDate(targetDate);
      if (targetHours.isOpenToday) {
        break;
      }
    }

    const targetOpenTime = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      targetHours.openHour,
      0,
      0
    );

    const diffMs = targetOpenTime.getTime() - now.getTime();
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

    const totalDays = Math.floor(diffSeconds / 86400);
    const remainingSecondsAfterDays = diffSeconds % 86400;
    const hours = Math.floor(remainingSecondsAfterDays / 3600);
    const minutes = Math.floor((remainingSecondsAfterDays % 3600) / 60);
    const seconds = remainingSecondsAfterDays % 60;

    const daysText = totalDays === 1 ? 'dia' : 'dias';
    const hoursText = hours === 1 ? 'hora' : 'horas';
    const minutesText = minutes === 1 ? 'minuto' : 'minutos';
    const secondsText = seconds === 1 ? 'segundo' : 'segundos';

    let countdownText = '';
    if (diffSeconds >= 24 * 3600) {
      countdownText = `A loja abrirá em ${pad(totalDays)} ${daysText} . ${pad(hours)} ${hoursText} . ${pad(minutes)} ${minutesText} . ${pad(seconds)} ${secondsText}`;
    } else {
      countdownText = `A loja abrirá em ${pad(hours)} ${hoursText} . ${pad(minutes)} ${minutesText} . ${pad(seconds)} ${secondsText}`;
    }

    return {
      isOpen: false,
      isSundayOrHoliday,
      countdownText,
      secondsRemaining: diffSeconds
    };
  }
}
