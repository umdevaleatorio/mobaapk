import React from 'react';
import { View } from 'react-native';
import { styles } from './TrackingScreen.styles';

export const ThermometerLine = ({ color, height = 70 }: { color: string, height?: number }) => (
  <View style={[styles.separatorWrapper, { height }]}>
    <View style={[styles.thermometerStick, { backgroundColor: color, height: height - 6 }]} />
    <View style={[styles.thermometerSquare, { backgroundColor: color }]} />
  </View>
);
