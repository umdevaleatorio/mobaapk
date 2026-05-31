import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, G, Text as SvgText } from 'react-native-svg';
import { styles } from './DashboardOverview.styles';

interface DashboardOverviewGraphProps {
  isDarkMode: boolean;
  loading: boolean;
  points: any[];
  maxVal: number;
  gWidth: number;
  gHeight: number;
  paddingBottom: number;
  paddingLeft: number;
  pathD: string;
  areaD: string;
}

export default function DashboardOverviewGraph({
  isDarkMode, loading, points, maxVal, gWidth, gHeight,
  paddingBottom, paddingLeft, pathD, areaD
}: DashboardOverviewGraphProps) {
  return (
    <View style={styles.graphContainer}>
      <Text style={[styles.graphTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
        Curva de Desempenho de Vendas
      </Text>

      {loading ? (
        <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#F97D01" />
        </View>
      ) : points.length === 0 ? (
        <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? '#A8A8B3' : '#767676' }}>Sem transações para plotar.</Text>
        </View>
      ) : (
        <View style={[styles.svgWrapper, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
          <Svg width={gWidth} height={gHeight}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#00BFA5" stopOpacity="0.4" />
                <Stop offset="1" stopColor="#00BFA5" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>
            <Line x1={paddingLeft} y1={20} x2={gWidth - 15} y2={20} stroke={isDarkMode ? '#3E3E4A' : '#E3E4EB'} strokeWidth={1} strokeDasharray="3,3" />
            <Line x1={paddingLeft} y1={80} x2={gWidth - 15} y2={80} stroke={isDarkMode ? '#3E3E4A' : '#E3E4EB'} strokeWidth={1} strokeDasharray="3,3" />
            <Line x1={paddingLeft} y1={140} x2={gWidth - 15} y2={140} stroke={isDarkMode ? '#3E3E4A' : '#E3E4EB'} strokeWidth={1} strokeDasharray="3,3" />
            {areaD ? <Path d={areaD} fill="url(#grad)" /> : null}
            {pathD ? <Path d={pathD} fill="none" stroke="#00BFA5" strokeWidth={3} /> : null}
            {points.map((p: any, idx: number) => (
              <G key={idx}>
                <Circle cx={p.x} cy={p.y} r={5} fill="#FFFFFF" stroke="#00BFA5" strokeWidth={2} />
                {p.value > 0 && (
                  <SvgText x={p.x} y={p.y - 10} fontSize="9" fontWeight="bold" fill={isDarkMode ? '#FFE082' : '#00BFA5'} textAnchor="middle">
                    {`R$${Math.round(p.value)}`}
                  </SvgText>
                )}
                <SvgText x={p.x} y={gHeight - 5} fontSize="9" fill={isDarkMode ? '#A8A8B3' : '#767676'} textAnchor="middle">
                  {p.label}
                </SvgText>
              </G>
            ))}
            <SvgText x={8} y={23} fontSize="9" fill={isDarkMode ? '#A8A8B3' : '#767676'}>{`R$${Math.round(maxVal)}`}</SvgText>
            <SvgText x={8} y={83} fontSize="9" fill={isDarkMode ? '#A8A8B3' : '#767676'}>{`R$${Math.round(maxVal / 2)}`}</SvgText>
            <SvgText x={8} y={143} fontSize="9" fill={isDarkMode ? '#A8A8B3' : '#767676'}>R$0</SvgText>
          </Svg>
        </View>
      )}
    </View>
  );
}
