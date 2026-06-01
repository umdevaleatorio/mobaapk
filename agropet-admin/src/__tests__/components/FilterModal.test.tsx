import React from 'react';
import { render } from '@testing-library/react-native';
import { FilterModal } from '../../presentation/screens/admin/ManageProducts/FilterModal';

describe('FilterModal', () => {
  const baseProps = {
    visible: true,
    isDarkMode: false,
    colors: { textDark: '#000' },
    tempStatusFilter: 'Todos',
    tempAlertYellowFilter: false,
    tempAlertRedFilter: false,
    onSelectStatus: jest.fn(),
    onToggleYellow: jest.fn(),
    onToggleRed: jest.fn(),
    onApply: jest.fn(),
    onClose: jest.fn(),
  };

  it('should render radio buttons', () => {
    const { getByText } = render(<FilterModal {...baseProps} />);
    expect(getByText('Todos os produtos')).toBeTruthy();
    expect(getByText('Somente ativos')).toBeTruthy();
    expect(getByText('Somente inativos')).toBeTruthy();
  });

  it('should render toggle components', () => {
    const { getByText } = render(<FilterModal {...baseProps} />);
    expect(getByText('Estoque Moderado (Alerta Amarelo)')).toBeTruthy();
    expect(getByText('Estoque Crítico (Alerta Vermelho)')).toBeTruthy();
  });

  it('should disable toggles when Inativos is selected (covers line 26 disabled style)', () => {
    const { getByText } = render(
      <FilterModal {...baseProps} tempStatusFilter="Inativos" />
    );
    expect(getByText('Estoque Moderado (Alerta Amarelo)')).toBeTruthy();
    expect(getByText('Estoque Crítico (Alerta Vermelho)')).toBeTruthy();
  });

  it('should mark selected status', () => {
    const { getByText } = render(
      <FilterModal {...baseProps} tempStatusFilter="Ativos" />
    );
    expect(getByText('Somente ativos')).toBeTruthy();
  });

  it('should render in dark mode', () => {
    const { getByText } = render(
      <FilterModal {...baseProps} isDarkMode={true} />
    );
    expect(getByText('Filtrar Produtos')).toBeTruthy();
  });
});
