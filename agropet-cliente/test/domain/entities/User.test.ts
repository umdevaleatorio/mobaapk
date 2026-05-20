import { User } from '../../../src/domain/entities/User';

describe('User Entity (Cliente)', () => {
  // ── Criação válida ──
  it('should create a valid client user with all fields', () => {
    const user = new User(
      'user-1',
      'Carlos Oliveira',
      'carlos@email.com',
      'client',
      '11999999999',
      'https://example.com/avatar.png'
    );

    expect(user.id).toBe('user-1');
    expect(user.name).toBe('Carlos Oliveira');
    expect(user.email).toBe('carlos@email.com');
    expect(user.role).toBe('client');
    expect(user.phone).toBe('11999999999');
    expect(user.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('should create a valid admin user', () => {
    const user = new User(
      'user-2',
      'Admin User',
      'admin@agropet.com',
      'admin'
    );

    expect(user.id).toBe('user-2');
    expect(user.name).toBe('Admin User');
    expect(user.role).toBe('admin');
  });

  it('should create user without optional fields (phone and avatarUrl)', () => {
    const user = new User(
      'user-3',
      'Sem Opcionais',
      'sem@opcionais.com',
      'client'
    );

    expect(user.phone).toBeUndefined();
    expect(user.avatarUrl).toBeUndefined();
  });

  // ── Validação de Email embutida ──
  it('should throw when email is invalid', () => {
    expect(() => new User(
      'user-4',
      'Invalid User',
      'not-an-email',
      'client'
    )).toThrow('Invalid email address');
  });

  it('should throw when email is empty', () => {
    expect(() => new User(
      'user-5',
      'Empty Email',
      '',
      'client'
    )).toThrow('Invalid email address');
  });
});
