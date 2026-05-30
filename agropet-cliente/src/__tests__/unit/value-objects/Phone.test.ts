import { Phone } from '../../../domain/value-objects/Phone';

describe('Phone Value Object', () => {
  it('should accept valid landline numbers', () => {
    const phone = new Phone('(35) 3456-7890');
    expect(phone.getValue()).toBe('3534567890');
    expect(phone.toFormatted()).toBe('(35) 3456-7890');
  });

  it('should accept valid mobile numbers', () => {
    const phone = new Phone('35998765432');
    expect(phone.getValue()).toBe('35998765432');
    expect(phone.toFormatted()).toBe('(35) 99876-5432');
  });

  it('should throw when empty', () => {
    expect(() => new Phone('')).toThrow('Phone number cannot be empty');
  });

  it('should throw for invalid digit count', () => {
    expect(() => new Phone('12345')).toThrow('Invalid Brazilian phone number length');
    expect(() => new Phone('123456789012')).toThrow('Invalid Brazilian phone number length');
  });
});
