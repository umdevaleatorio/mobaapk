import React from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { styles } from './AdminSettingsScreen.styles';

interface CustomSwitchProps {
  active: boolean;
  onPress: () => void;
  colorActive?: string;
  animValue: Animated.Value;
  isDarkMode: boolean;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ active, onPress, colorActive = '#EA841E', animValue, isDarkMode }) => {
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

export default CustomSwitch;
