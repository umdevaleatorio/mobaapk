import { isHoliday, getStoreHoursForDate, getShopStatus } from '../../utils/shopHours';

// Função utilitária de validação de datas (Teste 9)
// Garante reversão automática de intervalos inválidos (Ex: data inicial maior que final, ou data futura)
export function validateAndReverseDateRange(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const now = new Date();
  let start = new Date(startDate);
  let end = new Date(endDate);

  // Cap de datas futuras para a data atual
  if (start > now) start = new Date(now);
  if (end > now) end = new Date(now);

  // Reversão automática de intervalo inválido (start > end)
  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  return { start, end };
}

// Helpers de imagem (Teste 10)
export function getFirstImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (_) {}
  }
  return url;
}

export function getAllImageUrls(url: string | null | undefined): string[] {
  if (!url) return [];
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(i => typeof i === 'string');
    } catch (_) {}
  }
  return [url];
}

describe('Fase 3: Testes Unitários de Lógica Isolada (Prioridade 1)', () => {
  
  // ── Teste 8: Feriados Nacionais e Contadores de Horário (shopHours) ──
  describe('Teste 8: shopHours', () => {
    it('deve identificar corretamente feriados nacionais fixos brasileiros', () => {
      // 1 de Janeiro - Confraternização Universal
      expect(isHoliday(new Date('2026-01-01T12:00:00Z'))).toBe(true);
      // 7 de Setembro - Independência do Brasil
      expect(isHoliday(new Date('2026-09-07T12:00:00Z'))).toBe(true);
      // 25 de Dezembro - Natal
      expect(isHoliday(new Date('2026-12-25T12:00:00Z'))).toBe(true);
      // Dia comum - Não Feriado
      expect(isHoliday(new Date('2026-05-20T12:00:00Z'))).toBe(false);
    });

    it('deve calcular astronomicamente feriados brasileiros móveis baseados na Páscoa de 2026', () => {
      // Em 2026:
      // Sexta-feira Santa: 3 de Abril de 2026 (mês 3 em JS, já que Janeiro=0)
      expect(isHoliday(new Date(2026, 4 - 1, 3))).toBe(true);
      // Carnaval: 17 de Fevereiro de 2026 (mês 1 em JS)
      expect(isHoliday(new Date(2026, 2 - 1, 17))).toBe(true);
      // Corpus Christi: 4 de Junho de 2026 (mês 5 em JS)
      expect(isHoliday(new Date(2026, 6 - 1, 4))).toBe(true);
    });

    it('deve retornar configurações corretas de funcionamento da loja (getStoreHoursForDate)', () => {
      // Domingo - Fechado
      const sunday = new Date('2026-05-31T12:00:00'); // Domingo
      expect(getStoreHoursForDate(sunday)).toEqual({ isOpenToday: false, openHour: 0, closeHour: 0 });

      // Sábado - Aberto das 8h às 12h
      const saturday = new Date('2026-05-30T12:00:00'); // Sábado
      expect(getStoreHoursForDate(saturday)).toEqual({ isOpenToday: true, openHour: 8, closeHour: 12 });

      // Feriado - Aberto das 8h às 12h
      const holiday = new Date('2026-01-01T12:00:00'); // Ano Novo
      expect(getStoreHoursForDate(holiday)).toEqual({ isOpenToday: true, openHour: 8, closeHour: 12 });

      // Dia de semana comum - Aberto das 8h às 18h
      const weekday = new Date('2026-05-27T12:00:00'); // Quarta-feira
      expect(getStoreHoursForDate(weekday)).toEqual({ isOpenToday: true, openHour: 8, closeHour: 18 });
    });

    it('deve formatar corretamente o contador de status da loja (getShopStatus)', () => {
      // 1. Quarta-feira às 10:00 AM (Loja Aberta)
      const openTime = new Date('2026-05-27T10:00:00');
      const openStatus = getShopStatus(openTime);
      expect(openStatus.isOpen).toBe(true);
      expect(openStatus.countdownText).toContain('A loja fechará em');

      // 2. Quarta-feira às 07:00 AM (Loja Fechada, abre hoje)
      const earlyTime = new Date('2026-05-27T07:00:00');
      const earlyStatus = getShopStatus(earlyTime);
      expect(earlyStatus.isOpen).toBe(false);
      expect(earlyStatus.countdownText).toContain('A loja abrirá em');

      // 3. Sábado às 13:00 PM (Fechada, reabre segunda-feira já que domingo fecha)
      const closedTime = new Date('2026-05-30T13:00:00'); // Sábado
      const closedStatus = getShopStatus(closedTime);
      expect(closedStatus.isOpen).toBe(false);
      expect(closedStatus.countdownText).toContain('A loja abrirá em 01 dia');
    });
  });

  // ── Teste 9: Reversão Automática de Intervalo Inválido (Date Range Reverser) ──
  describe('Teste 9: Reversão Automática de Intervalo Inválido', () => {
    it('deve reverter as datas se a data de início for maior do que a data de término', () => {
      const start = new Date('2026-05-26');
      const end = new Date('2026-05-20');
      const result = validateAndReverseDateRange(start, end);

      expect(result.start.getTime()).toBe(end.getTime());
      expect(result.end.getTime()).toBe(start.getTime());
    });

    it('deve limitar datas futuras para a data atual (cap de segurança)', () => {
      const futureDate = new Date('2030-01-01');
      const pastDate = new Date('2026-05-20');
      const result = validateAndReverseDateRange(futureDate, pastDate);

      // A data futura deve ser limitada ao momento atual (agora)
      expect(result.end.getTime()).toBeLessThan(futureDate.getTime());
      expect(result.start.getTime()).toBe(pastDate.getTime());
    });
  });

  // ── Teste 10: Parsers de imagem (getFirstImageUrl / getAllImageUrls) ──
  describe('Teste 10: Parsers de Imagem', () => {
    it('deve retornar null se a url for nula ou vazia', () => {
      expect(getFirstImageUrl(null)).toBeNull();
      expect(getFirstImageUrl(undefined)).toBeNull();
      expect(getFirstImageUrl('')).toBeNull();
    });

    it('deve retornar a própria string se for uma url simples de foto única', () => {
      const singleUrl = 'https://example.com/dog.jpg';
      expect(getFirstImageUrl(singleUrl)).toBe(singleUrl);
      expect(getAllImageUrls(singleUrl)).toEqual([singleUrl]);
    });

    it('deve realizar o parse se for um array stringified JSON e retornar adequadamente', () => {
      const arrayJson = '["https://img1.jpg", "https://img2.jpg"]';
      expect(getFirstImageUrl(arrayJson)).toBe('https://img1.jpg');
      expect(getAllImageUrls(arrayJson)).toEqual(['https://img1.jpg', 'https://img2.jpg']);
    });

    it('deve lidar de forma segura com JSON inválido caindo no fallback da string original', () => {
      const invalidJson = '["https://img1.jpg"';
      expect(getFirstImageUrl(invalidJson)).toBe(invalidJson);
      expect(getAllImageUrls(invalidJson)).toEqual([invalidJson]);
    });
  });
});
