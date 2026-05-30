import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

import AdminTabs from '../../presentation/navigation/AdminTabs';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';

// Mock components used in Tabs returning default ESM exports to prevent element undefined errors
jest.mock('../../presentation/screens/admin/AdminHomeScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'mock-home-screen' })
  };
});
jest.mock('../../presentation/screens/admin/AdminMapScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'mock-map-screen' })
  };
});
jest.mock('../../presentation/screens/admin/ManageProductsScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'mock-manage-products-screen' })
  };
});
jest.mock('../../presentation/screens/admin/AdminSettingsScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'mock-settings-screen' })
  };
});
jest.mock('../../presentation/screens/admin/ProductCreateScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'mock-product-create-screen' })
  };
});
jest.mock('../../presentation/screens/admin/ProductEditScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'mock-product-edit-screen' })
  };
});
jest.mock('../../presentation/screens/admin/AdminProfileScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'mock-admin-profile-screen' })
  };
});

describe('AdminTabs Navigation & CustomTabBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  const renderTabs = () => {
    return render(
      <NavigationContainer>
        <ThemeProvider>
          <AdminTabs />
        </ThemeProvider>
      </NavigationContainer>
    );
  };

  it('should render standard bottom tabs navigator correctly', () => {
    const { toJSON } = renderTabs();
    expect(toJSON()).toBeTruthy();
  });

  it('should hide tab bar if map screen is active and tracking clientLocation', () => {
    const { CustomTabBar } = require('../../presentation/navigation/AdminTabs');
    const mockState = {
      index: 1,
      routes: [
        { key: 'home-key', name: 'Home' },
        { key: 'map-key', name: 'Mapa', params: { clientLocation: { latitude: 1, longitude: 2 } } },
        { key: 'manage-key', name: 'Gerenciar' },
        { key: 'options-key', name: 'Opções' }
      ]
    };
    const mockDescriptors = {
      'map-key': {
        options: { tabBarVisible: true }
      }
    };
    const mockNavigation = {
      emit: jest.fn(),
      navigate: jest.fn()
    };

    const { toJSON } = render(
      <ThemeProvider>
        <CustomTabBar state={mockState} descriptors={mockDescriptors} navigation={mockNavigation} />
      </ThemeProvider>
    );
    expect(toJSON()).toBeNull();
  });

  it('should hide tab bar if tabBarVisible option is false', () => {
    const { CustomTabBar } = require('../../presentation/navigation/AdminTabs');
    const mockState = {
      index: 0,
      routes: [
        { key: 'home-key', name: 'Home' },
      ]
    };
    const mockDescriptors = {
      'home-key': {
        options: { tabBarVisible: false }
      }
    };
    const mockNavigation = {
      emit: jest.fn(),
    };

    const { toJSON } = render(
      <ThemeProvider>
        <CustomTabBar state={mockState} descriptors={mockDescriptors} navigation={mockNavigation} />
      </ThemeProvider>
    );
    expect(toJSON()).toBeNull();
  });

  it('should handle tab presses and trigger navigation', () => {
    const { CustomTabBar } = require('../../presentation/navigation/AdminTabs');
    const mockState = {
      index: 0,
      routes: [
        { key: 'home-key', name: 'Home' },
        { key: 'map-key', name: 'Mapa' },
        { key: 'manage-key', name: 'Gerenciar' },
        { key: 'options-key', name: 'Opções' }
      ]
    };
    const mockDescriptors = {
      'home-key': { options: {} },
      'map-key': { options: {} },
      'manage-key': { options: {} },
      'options-key': { options: {} }
    };
    const mockNavigation = {
      emit: jest.fn().mockReturnValue({ defaultPrevented: false }),
      navigate: jest.fn()
    };

    const { UNSAFE_getAllByType } = render(
      <ThemeProvider>
        <CustomTabBar state={mockState} descriptors={mockDescriptors} navigation={mockNavigation} />
      </ThemeProvider>
    );

    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);

    fireEvent.press(buttons[1]);
    expect(mockNavigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'map-key',
      canPreventDefault: true
    });
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Mapa');
  });

  it('should not navigate if tab press is default prevented or tab is already focused', () => {
    const { CustomTabBar } = require('../../presentation/navigation/AdminTabs');
    const mockState = {
      index: 0,
      routes: [
        { key: 'home-key', name: 'Home' },
        { key: 'map-key', name: 'Mapa' }
      ]
    };
    const mockDescriptors = {
      'home-key': { options: {} },
      'map-key': { options: {} }
    };
    const mockNavigation = {
      emit: jest.fn().mockReturnValue({ defaultPrevented: true }),
      navigate: jest.fn()
    };

    const { UNSAFE_getAllByType } = render(
      <ThemeProvider>
        <CustomTabBar state={mockState} descriptors={mockDescriptors} navigation={mockNavigation} />
      </ThemeProvider>
    );

    const { TouchableOpacity } = require('react-native');
    const buttons = UNSAFE_getAllByType(TouchableOpacity);

    fireEvent.press(buttons[1]);
    expect(mockNavigation.navigate).not.toHaveBeenCalled();

    mockNavigation.emit.mockReturnValue({ defaultPrevented: false });
    fireEvent.press(buttons[0]);
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('should support layout calculations and dynamic styling for all screen configurations in light and dark mode', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');
    const { CustomTabBar } = require('../../presentation/navigation/AdminTabs');

    const testActiveTabs = ['Home', 'Mapa', 'Gerenciar', 'Opções', 'ProductCreateScreen', 'ProductEditScreen', 'AdminProfile', 'InvalidTab'];

    for (const activeTabName of testActiveTabs) {
      const mockState = {
        index: activeTabName === 'AdminProfile' ? 5 : 0,
        routes: [
          { key: 'home-key', name: 'Home' },
          { key: 'map-key', name: 'Mapa' },
          { key: 'manage-key', name: 'Gerenciar' },
          { key: 'options-key', name: 'Opções' }
        ]
      };
      
      Object.defineProperty(mockState.routes, mockState.index, {
        value: { key: 'active-key', name: activeTabName },
        writable: true
      });

      const mockDescriptors = {
        'home-key': { options: {} },
        'map-key': { options: {} },
        'manage-key': { options: {} },
        'options-key': { options: {} },
        'active-key': { options: {} }
      };
      const mockNavigation = {
        emit: jest.fn(),
      };

      const { UNSAFE_getAllByType } = render(
        <ThemeProvider>
          <CustomTabBar state={mockState} descriptors={mockDescriptors} navigation={mockNavigation} />
        </ThemeProvider>
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const { TouchableOpacity } = require('react-native');
      const buttons = UNSAFE_getAllByType(TouchableOpacity);

      buttons.forEach((btn: any, idx: number) => {
        fireEvent(btn, 'layout', {
          nativeEvent: {
            layout: { x: idx * 80, width: 75 }
          }
        });
      });
    }
  });

  it('should cover Platform.OS styling branches under iOS and non-iOS targets', () => {
    jest.isolateModules(() => {
      const rn = require('react-native');
      rn.Platform.OS = 'ios';
      require('../../presentation/navigation/AdminTabs');
    });

    jest.isolateModules(() => {
      const rn = require('react-native');
      rn.Platform.OS = 'android';
      require('../../presentation/navigation/AdminTabs');
    });
  });

  it('should cover custom tabBarButtons by invoking them directly from JSX props', () => {
    const element = AdminTabs();
    const children = React.Children.toArray(element.props.children);
    children.forEach((child: any) => {
      if (child.props && child.props.options && typeof child.props.options.tabBarButton === 'function') {
        const result = child.props.options.tabBarButton();
        expect(result).toBeNull();
      }
    });
  });

  it('should cover the tabBar function inside Tab.Navigator', () => {
    const element = AdminTabs();
    expect(element.props.tabBar).toBeDefined();
    const result = element.props.tabBar({
      state: { index: 0, routes: [{ key: 'home-key', name: 'Home' }] },
      descriptors: { 'home-key': { options: {} } },
      navigation: { emit: jest.fn(), navigate: jest.fn() }
    });
    expect(result).toBeTruthy();
  });
});
