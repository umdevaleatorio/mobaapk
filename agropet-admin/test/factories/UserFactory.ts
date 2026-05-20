import { User } from '../../src/domain/entities/User';

export class UserFactory {
  static create(overrides?: Partial<{
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    phone: string;
    avatarUrl: string;
  }>): User {
    return new User(
      overrides?.id ?? 'user-1',
      overrides?.name ?? 'Admin Teste',
      overrides?.email ?? 'admin@agropet.com',
      overrides?.role ?? 'admin',
      overrides?.phone ?? '35999999999',
      overrides?.avatarUrl ?? 'https://example.com/avatar.png'
    );
  }
}
