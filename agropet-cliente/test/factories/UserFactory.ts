import { User } from '../../src/domain/entities/User';

export class UserFactory {
  static create(overrides?: Partial<{
    id: string;
    name: string;
    email: string;
    role: 'client' | 'admin';
    phone: string;
    avatarUrl: string;
  }>): User {
    return new User(
      overrides?.id ?? 'user-1',
      overrides?.name ?? 'Cliente Teste',
      overrides?.email ?? 'cliente@agropet.com',
      overrides?.role ?? 'client',
      overrides?.phone ?? '11999999999',
      overrides?.avatarUrl ?? 'https://example.com/avatar.png'
    );
  }
}
