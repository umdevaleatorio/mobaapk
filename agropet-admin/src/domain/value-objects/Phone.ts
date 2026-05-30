export class Phone {
  private readonly value: string;

  constructor(phone: string) {
    if (!phone) {
      throw new Error('Phone number cannot be empty');
    }
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10 || clean.length > 11) {
      throw new Error('Invalid Brazilian phone number length');
    }
    this.value = clean;
  }

  getValue(): string {
    return this.value;
  }

  toFormatted(): string {
    if (this.value.length === 11) {
      return `(${this.value.slice(0, 2)}) ${this.value.slice(2, 7)}-${this.value.slice(7)}`;
    }
    return `(${this.value.slice(0, 2)}) ${this.value.slice(2, 6)}-${this.value.slice(6)}`;
  }
}
