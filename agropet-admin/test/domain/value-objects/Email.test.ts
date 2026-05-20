import { Email } from '../../../src/domain/value-objects/Email';

describe('Email Value Object', () => {
  // ── Casos válidos ──
  it('should create a valid email and return its value', () => {
    const email = new Email('admin@agropet.com');
    expect(email.getValue()).toBe('admin@agropet.com');
  });

  it('should accept email with subdomains', () => {
    const email = new Email('user@mail.agropet.com.br');
    expect(email.getValue()).toBe('user@mail.agropet.com.br');
  });

  it('should accept email with numbers', () => {
    const email = new Email('user123@domain456.com');
    expect(email.getValue()).toBe('user123@domain456.com');
  });

  it('should accept email with special characters in local part', () => {
    const email = new Email('user.name+tag@example.com');
    expect(email.getValue()).toBe('user.name+tag@example.com');
  });

  // ── Casos inválidos ──
  it('should throw for email without @', () => {
    expect(() => new Email('invalid-email')).toThrow('Invalid email address');
  });

  it('should throw for email without domain extension', () => {
    expect(() => new Email('user@com')).toThrow('Invalid email address');
  });

  it('should throw for empty string', () => {
    expect(() => new Email('')).toThrow('Invalid email address');
  });

  it('should throw for email with spaces only', () => {
    expect(() => new Email('   ')).toThrow('Invalid email address');
  });
});
