import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DeletedUsersModal from '../../presentation/screens/admin/AdminSettings/DeletedUsersModal';

jest.mock('../../presentation/screens/admin/AdminSettings/AdminSettingsScreen.styles', () => ({
  styles: {
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    whiteModalContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, width: '90%' },
    whiteModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    whiteModalDesc: { fontSize: 14, color: '#666' },
  },
}));

describe('DeletedUsersModal', () => {
  const baseProps = {
    visible: true,
    onClose: jest.fn(),
    loading: false,
    onHardDelete: jest.fn(),
    isDarkMode: false,
    deletedUsers: [
      {
        id: 'u1',
        name: 'User 1',
        email: 'user1@test.com',
        phone: '11999998888',
        deleted_at: '2025-01-01T10:00:00Z',
        scheduled_delete_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'u2',
        name: 'User 2',
        email: 'user2@test.com',
        phone: null,
        deleted_at: '2025-02-01T10:00:00Z',
        scheduled_delete_at: new Date(Date.now() + 86400000).toISOString(),
      },
    ],
  };

  it('should render loading state', () => {
    const { UNSAFE_getAllByType } = render(<DeletedUsersModal {...baseProps} loading={true} />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it('should render empty state when no users', () => {
    const { getByText } = render(<DeletedUsersModal {...baseProps} deletedUsers={[]} />);
    expect(getByText('Nenhuma conta marcada para exclusão.')).toBeTruthy();
  });

  it('should render user list with expired and non-expired items (light mode)', () => {
    const { getByText } = render(<DeletedUsersModal {...baseProps} isDarkMode={false} />);
    expect(getByText('User 1')).toBeTruthy();
    expect(getByText('user1@test.com')).toBeTruthy();
    expect(getByText('11999998888')).toBeTruthy();
    expect(getByText('Pronta para remoção permanente')).toBeTruthy();
    expect(getByText('Excluir Permanentemente')).toBeTruthy();
    expect(getByText('User 2')).toBeTruthy();
  });

  it('should render user list in dark mode', () => {
    const { getByText } = render(<DeletedUsersModal {...baseProps} isDarkMode={true} />);
    expect(getByText('User 1')).toBeTruthy();
    expect(getByText('user1@test.com')).toBeTruthy();
  });

  it('should render user with null name (fallback to "Sem nome")', () => {
    const props = {
      ...baseProps,
      deletedUsers: [{
        ...baseProps.deletedUsers[0],
        name: null as any,
      }],
    };
    const { getByText } = render(<DeletedUsersModal {...props} />);
    expect(getByText('Sem nome')).toBeTruthy();
  });

  it('should call onHardDelete when pressing delete button', () => {
    const onHardDelete = jest.fn();
    const { getByText } = render(
      <DeletedUsersModal {...baseProps} onHardDelete={onHardDelete} />
    );
    fireEvent.press(getByText('Excluir Permanentemente'));
    expect(onHardDelete).toHaveBeenCalledWith('u1');
  });

  it('should call onClose when pressing close button', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <DeletedUsersModal {...baseProps} onClose={onClose} />
    );
    fireEvent.press(getByText('Fechar'));
    expect(onClose).toHaveBeenCalled();
  });
});
