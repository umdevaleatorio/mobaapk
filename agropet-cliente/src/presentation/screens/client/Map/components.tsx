import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle, Line, Path, Rect, G, Ellipse } from 'react-native-svg';

export const CustomDot = ({ color, borderColor, size = 20 }: { color: string; borderColor: string; size?: number }) => (
  <View style={{
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    borderWidth: 3,
    borderColor: borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  }} />
);

export const LegendPin = ({ color }: { color: string }) => (
  <Svg width="20" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </Svg>
);

export const FiorinoIcon = ({ facingRight = true }: { facingRight?: boolean }) => {
  const jumpValue = useRef(new Animated.Value(0)).current;
  const scaleYValue = useRef(new Animated.Value(1)).current;
  const prevFacingRight = useRef(facingRight);

  useEffect(() => {
    if (prevFacingRight.current !== facingRight) {
      prevFacingRight.current = facingRight;

      Animated.sequence([
        Animated.timing(scaleYValue, {
          toValue: 0.82,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(jumpValue, {
            toValue: -14,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scaleYValue, {
            toValue: 1.18,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(jumpValue, {
            toValue: 0,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(scaleYValue, {
              toValue: 0.78,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.spring(scaleYValue, {
              toValue: 1,
              friction: 3,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [facingRight]);

  return (
    <Animated.View style={{
      width: 48,
      height: 34,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#4CAF50',
      padding: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 3.5,
      elevation: 6,
      transform: [
        { translateY: jumpValue },
        { scaleY: scaleYValue },
        { scaleX: facingRight ? 1 : -1 }
      ],
    }}>
      <Svg width="40" height="26" viewBox="0 0 40 26" fill="none">
        <Ellipse cx="20" cy="24" rx="16" ry="2" fill="rgba(0, 0, 0, 0.15)" />
        <Path
          d="M2 3C2 1.89543 2.89543 1 4 1H22C23.1046 1 24 1.89543 24 3V18H2V3Z"
          fill="#EEEEEE"
        />
        <Path
          d="M4 2H22V6H4V2Z"
          fill="#F9F9F9"
        />
        <Rect x="6" y="5" width="12" height="9" rx="1.5" fill="#4CAF50" />
        <Circle cx="12" cy="10" r="2.5" fill="#FFFFFF" />
        <Circle cx="10" cy="8" r="0.8" fill="#FFFFFF" />
        <Circle cx="14" cy="8" r="0.8" fill="#FFFFFF" />
        <Circle cx="12" cy="7" r="0.8" fill="#FFFFFF" />
        <Path
          d="M24 6H29.5C31.1543 6 32.6974 6.78441 33.6569 8.1278L37.4831 13.0845C38.4586 14.4503 38.4005 16.2794 37.3414 17.5794L37 18H24V6Z"
          fill="#FFFFFF"
        />
        <Path
          d="M25 8H29L32.5 13H25V8Z"
          fill="#1A3A6B"
        />
        <Path
          d="M26 9H28L30.5 12.5H29.5L27 9Z"
          fill="#4A90E2"
          opacity="0.6"
        />
        <Circle cx="9" cy="19" r="5" fill="#222" />
        <Circle cx="9" cy="19" r="3.5" fill="#555" />
        <Circle cx="9" cy="19" r="1.5" fill="#FFF" />
        <Circle cx="28" cy="19" r="5" fill="#222" />
        <Circle cx="28" cy="19" r="3.5" fill="#555" />
        <Circle cx="28" cy="19" r="1.5" fill="#FFF" />
        <Path
          d="M36.5 13.5C37.5 13.5 38.5 14.5 38.5 15.5H35.5C35.5 14.5 36.5 13.5 36.5 13.5Z"
          fill="#FFD54F"
        />
        <Path
          d="M38.5 15.5L40 16.5L39 17.5L37.5 16.5L38.5 15.5Z"
          fill="#FFF9C4"
          opacity="0.8"
        />
        <Path d="M1 18H4V20H1V18Z" fill="#333333" />
        <Path d="M33 18H37C37.5523 18 38 17.5523 38 17V16.5H32.5L33 18Z" fill="#333333" />
      </Svg>
    </Animated.View>
  );
};
