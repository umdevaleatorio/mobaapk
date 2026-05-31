import React from 'react';
import { View, Text, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './CaixaGlobalPanel.styles';

interface CaixaGlobalPanelProps {
  isDarkMode: boolean;
  saldoTotalCaixaGeral: number;
  totalDinheiroCaixaGeral: number;
  pulseAnim: Animated.Value;
  formatCurrency: (val: number) => string;
  totalCreditoGeral: number;
  totalDebitoGeral: number;
  totalPixGeral: number;
}

export const CaixaGlobalPanel = ({
  isDarkMode,
  saldoTotalCaixaGeral,
  totalDinheiroCaixaGeral,
  pulseAnim,
  formatCurrency,
  totalCreditoGeral,
  totalDebitoGeral,
  totalPixGeral,
}: CaixaGlobalPanelProps) => {
  return (
    <View style={[styles.caixaCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' }]}>
      <View style={styles.caixaTopRow}>
        <View>
          <Text style={styles.caixaTitle}>Saldo Total em Caixa</Text>
          <Text style={[styles.caixaValue, { color: saldoTotalCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]}>
            {formatCurrency(saldoTotalCaixaGeral)}
          </Text>
        </View>
        <View style={styles.pulseContainer}>
          <View style={[styles.pulseDot, { backgroundColor: totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]} />
          <Animated.View style={[
            styles.pulseRing,
            { borderColor: totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252' },
            {
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })
            }
          ]} />
        </View>
      </View>

      <View style={styles.caixaDivider} />

      <View style={styles.caixaSubGrid}>
        <View style={styles.caixaSubItem}>
          <Feather name="credit-card" size={14} color="#FF5252" />
          <Text style={styles.caixaSubLabel}>Crédito</Text>
          <Text style={styles.caixaSubValue}>{formatCurrency(totalCreditoGeral)}</Text>
        </View>
        <View style={styles.caixaSubItem}>
          <Feather name="credit-card" size={14} color="#4CAF50" />
          <Text style={styles.caixaSubLabel}>Débito</Text>
          <Text style={styles.caixaSubValue}>{formatCurrency(totalDebitoGeral)}</Text>
        </View>
        <View style={styles.caixaSubItem}>
          <Feather name="smartphone" size={14} color="#00E676" />
          <Text style={styles.caixaSubLabel}>Pix</Text>
          <Text style={styles.caixaSubValue}>{formatCurrency(totalPixGeral)}</Text>
        </View>
        <View style={styles.caixaSubItem}>
          <Feather name="dollar-sign" size={14} color={totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252'} />
          <Text style={styles.caixaSubLabel}>Dinheiro</Text>
          <Text style={[styles.caixaSubValue, { color: totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]}>
            {formatCurrency(totalDinheiroCaixaGeral)}
          </Text>
        </View>
      </View>
    </View>
  );
};
