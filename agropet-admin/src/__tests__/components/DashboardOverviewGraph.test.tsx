import React from 'react';
import { render } from '@testing-library/react-native';
import DashboardOverviewGraph from '../../presentation/screens/admin/AdminDashboard/components/DashboardOverview/DashboardOverviewGraph';

jest.mock('../../presentation/screens/admin/AdminDashboard/components/DashboardOverview/DashboardOverview.styles', () => ({
  styles: {
    graphContainer: { padding: 16 },
    graphTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    svgWrapper: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  },
}));

const baseProps = {
  isDarkMode: false,
  loading: false,
  points: [{ x: 50, y: 100, value: 150, label: 'Seg' }],
  maxVal: 200,
  gWidth: 300,
  gHeight: 180,
  paddingBottom: 20,
  paddingLeft: 40,
  pathD: 'M 50 100 L 100 80',
  areaD: 'M 50 100 L 100 80 L 100 180 L 50 180 Z',
};

describe('DashboardOverviewGraph', () => {
  it('should render loading state', () => {
    const { UNSAFE_getAllByType } = render(<DashboardOverviewGraph {...baseProps} loading={true} />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThan(0);
  });

  it('should render empty state (points.length === 0) with isDarkMode true', () => {
    const { getByText } = render(<DashboardOverviewGraph {...baseProps} points={[]} isDarkMode={true} />);
    expect(getByText('Sem transações para plotar.')).toBeTruthy();
  });

  it('should render empty state with isDarkMode false', () => {
    const { getByText } = render(<DashboardOverviewGraph {...baseProps} points={[]} isDarkMode={false} />);
    expect(getByText('Sem transações para plotar.')).toBeTruthy();
  });

  it('should render graph without areaD (areaD is falsy)', () => {
    const { UNSAFE_getAllByType } = render(<DashboardOverviewGraph {...baseProps} areaD={null as any} />);
    const Svg = require('react-native-svg');
    // Should not crash
    expect(UNSAFE_getAllByType(Svg.Svg).length).toBeGreaterThan(0);
  });

  it('should render graph without pathD (pathD is falsy)', () => {
    const { UNSAFE_getAllByType } = render(<DashboardOverviewGraph {...baseProps} pathD={null as any} />);
    const Svg = require('react-native-svg');
    expect(UNSAFE_getAllByType(Svg.Svg).length).toBeGreaterThan(0);
  });

  it('should render graph with data and dark mode', () => {
    const { UNSAFE_getAllByType } = render(<DashboardOverviewGraph {...baseProps} isDarkMode={true} />);
    const Svg = require('react-native-svg');
    expect(UNSAFE_getAllByType(Svg.Svg).length).toBeGreaterThan(0);
  });
});
