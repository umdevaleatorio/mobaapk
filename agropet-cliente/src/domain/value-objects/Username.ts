export class Username {
  constructor(public readonly value: string) {
    if (!value || value.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    if (value.length > 50) {
      throw new Error('Username cannot exceed 50 characters');
    }
    if (/[<>&"'/]/.test(value)) {
      throw new Error('Username contains invalid characters');
    }
  }
}
