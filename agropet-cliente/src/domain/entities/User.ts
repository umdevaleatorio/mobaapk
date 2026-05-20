import { Email } from '../value-objects/Email';

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly role: 'client' | 'admin',
    public readonly phone?: string,
    public readonly avatarUrl?: string
  ) {
    new Email(email);
  }
}
