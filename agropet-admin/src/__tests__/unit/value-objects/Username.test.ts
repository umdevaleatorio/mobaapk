import { Username } from '../../../domain/value-objects/Username';

describe('Username Value Object', () => {
  it('should accept valid username', () => {
    const user = new Username('Caio Souza');
    expect(user.value).toBe('Caio Souza');
  });

  it('should throw when username is too short', () => {
    expect(() => new Username('ab')).toThrow('Username must be at least 3 characters long');
    expect(() => new Username('  ')).toThrow('Username must be at least 3 characters long');
  });

  it('should throw when username is too long', () => {
    const longName = 'a'.repeat(51);
    expect(() => new Username(longName)).toThrow('Username cannot exceed 50 characters');
  });

  it('should throw when containing injection characters', () => {
    expect(() => new Username('Caio<script>')).toThrow('Username contains invalid characters');
    expect(() => new Username('Caio" OR "1"="1')).toThrow('Username contains invalid characters');
  });
});
