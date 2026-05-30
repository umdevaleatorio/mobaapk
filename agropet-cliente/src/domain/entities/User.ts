import { Email } from '../value-objects/Email';
import { Phone } from '../value-objects/Phone';
import { Username } from '../value-objects/Username';

export class User {
  public readonly emailVO: Email;
  public readonly phoneVO?: Phone;
  public readonly usernameVO: Username;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly role: 'admin' | 'employee' | 'client',
    public readonly phone?: string,
    public readonly avatarUrl?: string
  ) {
    this.emailVO = new Email(email);
    this.usernameVO = new Username(name);
    if (phone) {
      this.phoneVO = new Phone(phone);
    }
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  hasAccessLevel(requiredRole: 'admin' | 'employee' | 'client'): boolean {
    if (requiredRole === 'client') return true;
    if (requiredRole === 'employee') return this.role === 'employee' || this.role === 'admin';
    return this.role === 'admin';
  }
}
