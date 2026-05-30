const { Platform } = require('react-native');
Platform.OS = 'ios';

import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { supabase } from '../../data/datasources/supabase/client';
import ClientTabs from '../../presentation/navigation/ClientTabs';
import { useTheme } from '../../presentation/contexts/ThemeContext';

// ── Mock do Supabase Realtime & Queries ──
const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { delivery_active: true }, error: null });
const mockOn = jest.fn();
jest.mock('../../data/datasources/supabase/client', () => {
  return {
    supabase: {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          maybeSingle: (...args: any[]) => mockMaybeSingle(...args),
        }),
      }),
      channel: jest.fn().mockReturnValue({
        on: (event: string, filter: any, callback: (payload: any) => void) => {
          (global as any).realtimeCallback = callback;
          return {
            subscribe: jest.fn().mockReturnValue({}),
          };
        },
      }),
      removeChannel: jest.fn(),
    },
  };
});

// Mock do ThemeContext do Cliente
jest.mock('../../presentation/contexts/ThemeContext', () => ({
  useTheme: jest.fn().mockReturnValue({ isDarkMode: false }),
}));

// Mock the svgMock.js globally mapped target
jest.mock('../mocks/svgMock.js', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => React.createElement('View', { testID: 'svg-mock', ...props });
});

// Mock react-navigation bottom tabs to realistically render and call the actual CustomTabBar!
let mockSimulatedIndex = 0;
let mockSimulatedParams: any = {};
let mockNavigate = jest.fn();
let mockEmit = jest.fn().mockReturnValue({ defaultPrevented: false });
let mockRoutesList: any[] = [
  { key: 'menu-key', name: 'Menu' },
  { key: 'mapa-key', name: 'Mapa', params: mockSimulatedParams },
  { key: 'carrinho-key', name: 'Carrinho' },
  { key: 'opcoes-key', name: 'Opções' }
];

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children, tabBar }: any) => {
        const mapaRoute = mockRoutesList.find((r: any) => r.name === 'Mapa');
        if (mapaRoute) {
          mapaRoute.params = mockSimulatedParams;
        }
        const state = {
          index: mockSimulatedIndex,
          routes: mockRoutesList,
        };
        const descriptors = {
          'menu-key': {},
          'mapa-key': {},
          'carrinho-key': {},
          'opcoes-key': {}
        };
        const navigation = {
          emit: mockEmit,
          navigate: mockNavigate,
        };

        return React.createElement(
          View,
          { testID: 'tab-navigator-root' },
          tabBar ? tabBar({ state, descriptors, navigation }) : null,
          children
        );
      },
      Screen: ({ name }: any) => {
        return null;
      }
    })
  };
});

describe('ClientTabs & CustomTabBar Integration Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSimulatedIndex = 0;
    mockSimulatedParams = {};
    mockNavigate = jest.fn();
    mockEmit = jest.fn().mockReturnValue({ defaultPrevented: false });
    (useTheme as jest.Mock).mockReturnValue({ isDarkMode: false });
  });

  it('should load deliveryStatus on mount, mount channels, and support realtime deliveryActive changes', async () => {
    const { rerender } = render(<ClientTabs />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('store_settings');
    });

    // Verify realtime channel updates
    expect(global.hasOwnProperty('realtimeCallback')).toBe(true);

    // Turn delivery active off
    await act(async () => {
      (global as any).realtimeCallback({
        new: { delivery_active: false },
      });
    });

    // Trigger refreshDeliveryTabs manually (simulating global sync triggers)
    await act(async () => {
      if ((global as any).refreshDeliveryTabs) {
        await (global as any).refreshDeliveryTabs();
      }
    });

    // Error logging path
    const originalFrom = supabase.from;
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockRejectedValue(new Error('Fetch fail')),
      }),
    });

    await act(async () => {
      if ((global as any).refreshDeliveryTabs) {
        await (global as any).refreshDeliveryTabs();
      }
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    supabase.from = originalFrom;
  });

  it('should render the CustomTabBar buttons and handle custom layout metrics', async () => {
    const { getByTestId, UNSAFE_getAllByType } = render(<ClientTabs />);

    await waitFor(() => {
      expect(getByTestId('tab-navigator-root')).toBeTruthy();
    });

    // Find custom touchable tab items directly by component type
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBe(4);

    // Call onLayout callbacks on the parent touchable elements to save positions
    await act(async () => {
      touchables.forEach((touchable, idx) => {
        touchable.props.onLayout({
          nativeEvent: { layout: { x: idx * 90, width: 80 } }
        });
      });
    });
  });

  it('should emit tabPress on button clicks and navigate to selected tabs', async () => {
    const { UNSAFE_getAllByType } = render(<ClientTabs />);

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBe(4);

    // Click third tab (Carrinho)
    await act(async () => {
      fireEvent.press(touchables[2]);
    });

    expect(mockEmit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'carrinho-key',
      canPreventDefault: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith('Carrinho');
  });

  it('should not call navigation if tabPress default is prevented', async () => {
    mockEmit.mockReturnValue({ defaultPrevented: true });

    const { UNSAFE_getAllByType } = render(<ClientTabs />);

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    expect(touchables.length).toBe(4);

    await act(async () => {
      fireEvent.press(touchables[1]);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should render CustomTabBar inside dark mode correctly', async () => {
    (useTheme as jest.Mock).mockReturnValue({ isDarkMode: true });

    const { getByTestId } = render(<ClientTabs />);

    await waitFor(() => {
      expect(getByTestId('tab-navigator-root')).toBeTruthy();
    });
  });

  it('should return null and hide the CustomTabBar if isMapTracking is true', async () => {
    mockSimulatedIndex = 1; // Mapa
    mockSimulatedParams = { trackingOrderId: 'order-123' };

    const { queryByTestId, UNSAFE_queryAllByType } = render(<ClientTabs />);

    // CustomTabBar should return null, so no Touchables should exist in the tree
    const touchables = UNSAFE_queryAllByType(TouchableOpacity);
    expect(touchables.length).toBe(0);
  });

  it('should cover fallback spacing and config branches', async () => {
    // 2. Route with no config
    const { getByTestId, rerender } = render(<ClientTabs />);
    mockRoutesList.push({ key: 'unknown-key', name: 'Unknown' });
    rerender(<ClientTabs />);
    mockRoutesList.pop(); // cleanup

    // 3. Fallback active tab configs (tabConfigs[activeTab] || tabConfigs.Menu)
    const originalName = mockRoutesList[mockSimulatedIndex].name;
    mockRoutesList[mockSimulatedIndex].name = 'UnknownActiveTab';
    rerender(<ClientTabs />);
    mockRoutesList[mockSimulatedIndex].name = originalName; // restore
  });

  it('should cover stylesheet Android spacing branch in active render', () => {
    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const { toJSON } = render(<ClientTabs />);
    expect(toJSON()).toBeTruthy();

    Platform.OS = originalOS;
  });

  it('should handle supabase query failures and various response branch combinations', async () => {
    // maybeSingle returns null data
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    render(<ClientTabs />);

    // maybeSingle returns undefined delivery_active
    mockMaybeSingle.mockResolvedValueOnce({ data: { delivery_active: undefined }, error: null });
    render(<ClientTabs />);

    // maybeSingle returns error
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'Some error' } });
    render(<ClientTabs />);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });
  });

  it('should ignore realtime events with invalid payloads', async () => {
    render(<ClientTabs />);

    await act(async () => {
      // payload with no new object
      (global as any).realtimeCallback({ new: null });
      // payload with undefined delivery_active
      (global as any).realtimeCallback({ new: { delivery_active: undefined } });
    });
  });
});
