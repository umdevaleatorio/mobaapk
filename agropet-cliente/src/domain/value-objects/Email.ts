export class Email {
  private readonly value: string;
  constructor(email: string) {
    if (!this.validate(email)) throw new Error('Invalid email address');
    this.value = email;
  }
  private validate(email: string): boolean {
    return /\S+@\S+\.\S+/.test(email);
  }
  getValue(): string { return this.value; }
}
