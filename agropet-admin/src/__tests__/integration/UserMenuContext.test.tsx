import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { Text, Button } from 'react-native';
import { UserMenuProvider, useUserMenu } from '../../presentation/contexts/UserMenuContext';

function UserMenuConsumer() {
  const { isMenuVisible, toggleMenu, closeMenu } = useUserMenu();
  return (
    <>
      <Text testID="visible">{isMenuVisible ? 'visible' : 'hidden'}</Text>
      <Button title="Toggle" onPress={toggleMenu} testID="toggle-btn" />
      <Button title="Close" onPress={closeMenu} testID="close-btn" />
    </>
  );
}

describe('UserMenuContext (Admin)', () => {
  it('should manage menu visibility state correctly', () => {
    const { getByTestId } = render(
      <UserMenuProvider>
        <UserMenuConsumer />
      </UserMenuProvider>
    );

    expect(getByTestId('visible').props.children).toBe('hidden');

    const toggleBtn = getByTestId('toggle-btn');
    const closeBtn = getByTestId('close-btn');

    // Toggle to Visible
    act(() => {
      fireEvent.press(toggleBtn);
    });
    expect(getByTestId('visible').props.children).toBe('visible');

    // Toggle to Hidden
    act(() => {
      fireEvent.press(toggleBtn);
    });
    expect(getByTestId('visible').props.children).toBe('hidden');

    // Toggle to Visible again
    act(() => {
      fireEvent.press(toggleBtn);
    });
    expect(getByTestId('visible').props.children).toBe('visible');

    // Close actively
    act(() => {
      fireEvent.press(closeBtn);
    });
    expect(getByTestId('visible').props.children).toBe('hidden');
  });
});
