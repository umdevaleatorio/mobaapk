import React from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface CustomSwitchProps {
  active: boolean;
  onPress: () => void;
  colorActive?: string;
  animValue: Animated.Value;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ active, onPress, colorActive = '#EA841E', animValue }) => {
  const { isDarkMode } = useTheme();

  const trackColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [isDarkMode ? '#2E2E38' : '#C0CADE', colorActive],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 27],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[styles.switchTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.switchThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  switchTrack: {
    width: 54,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 3,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default CustomSwitch;
