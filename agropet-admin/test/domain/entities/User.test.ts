import { User } from '../../../src/domain/entities/User';

describe('User Entity (Admin)', () => {
  // ── Criação válida ──
  it('should create a valid admin user with all fields', () => {
    const user = new User(
      'user-1',
      'João Silva',
      'joao@agropet.com',
      'admin',
      '35999999999',
      'https://example.com/avatar.png'
    );

    expect(user.id).toBe('user-1');
    expect(user.name).toBe('João Silva');
    expect(user.email).toBe('joao@agropet.com');
    expect(user.role).toBe('admin');
    expect(user.phone).toBe('35999999999');
    expect(user.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('should create a valid employee user', () => {
    const user = new User(
      'user-2',
      'Maria Santos',
      'maria@agropet.com',
      'employee'
    );

    expect(user.id).toBe('user-2');
    expect(user.name).toBe('Maria Santos');
    expect(user.email).toBe('maria@agropet.com');
    expect(user.role).toBe('employee');
  });

  it('should create user without optional fields (phone and avatarUrl)', () => {
    const user = new User(
      'user-3',
      'Pedro Alves',
      'pedro@agropet.com',
      'admin'
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
      'admin'
    )).toThrow('Invalid email address');
  });

  it('should throw when email is empty', () => {
    expect(() => new User(
      'user-5',
      'Empty Email',
      '',
      'admin'
    )).toThrow('Invalid email address');
  });
});
