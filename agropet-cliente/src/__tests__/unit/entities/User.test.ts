import { User } from '../../../domain/entities/User';

describe('User Entity', () => {
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

  it('should throw when email is invalid', () => {
    expect(() => new User(
      'user-4',
      'Invalid User',
      'not-an-email',
      'admin'
    )).toThrow('Invalid email address');
  });

  it('should check isAdmin correctly', () => {
    const admin = new User('1', 'João', 'joao@agropet.com', 'admin');
    const employee = new User('2', 'Maria', 'maria@agropet.com', 'employee');
    expect(admin.isAdmin()).toBe(true);
    expect(employee.isAdmin()).toBe(false);
  });

  it('should check hasAccessLevel correctly', () => {
    const admin = new User('1', 'João', 'joao@agropet.com', 'admin');
    const employee = new User('2', 'Maria', 'maria@agropet.com', 'employee');
    const client = new User('3', 'Caio', 'caio@gmail.com', 'client');

    expect(admin.hasAccessLevel('admin')).toBe(true);
    expect(admin.hasAccessLevel('employee')).toBe(true);
    expect(admin.hasAccessLevel('client')).toBe(true);

    expect(employee.hasAccessLevel('admin')).toBe(false);
    expect(employee.hasAccessLevel('employee')).toBe(true);
    expect(employee.hasAccessLevel('client')).toBe(true);

    expect(client.hasAccessLevel('admin')).toBe(false);
    expect(client.hasAccessLevel('employee')).toBe(false);
    expect(client.hasAccessLevel('client')).toBe(true);
  });
});
