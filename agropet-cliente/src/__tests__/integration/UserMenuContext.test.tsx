import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { Text, Button, View } from 'react-native';
import { UserMenuProvider, useUserMenu } from '../../presentation/contexts/UserMenuContext';

function UserMenuConsumer() {
  const { isMenuVisible, toggleMenu, closeMenu } = useUserMenu();

  return (
    <View>
      <Text testID="menu-status">{isMenuVisible ? 'visible' : 'hidden'}</Text>
      <Button title="Toggle Menu" onPress={toggleMenu} />
      <Button title="Close Menu" onPress={closeMenu} />
    </View>
  );
}

describe('UserMenuContext & UserMenuProvider', () => {
  it('should toggle and close the user menu correctly', async () => {
    const { getByText, getByTestId } = render(
      <UserMenuProvider>
        <UserMenuConsumer />
      </UserMenuProvider>
    );

    // Initial state
    expect(getByTestId('menu-status').props.children).toBe('hidden');

    // Toggle menu (should be visible)
    await act(async () => {
      fireEvent.press(getByText('Toggle Menu'));
    });
    expect(getByTestId('menu-status').props.children).toBe('visible');

    // Toggle menu again (should be hidden)
    await act(async () => {
      fireEvent.press(getByText('Toggle Menu'));
    });
    expect(getByTestId('menu-status').props.children).toBe('hidden');

    // Make visible and call closeMenu directly (should be hidden)
    await act(async () => {
      fireEvent.press(getByText('Toggle Menu'));
    });
    expect(getByTestId('menu-status').props.children).toBe('visible');

    await act(async () => {
      fireEvent.press(getByText('Close Menu'));
    });
    expect(getByTestId('menu-status').props.children).toBe('hidden');
  });
});
