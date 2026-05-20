import React from 'react';
import { SvgXml } from 'react-native-svg';

interface SvgAssetProps {
  xml: string;
  width?: number | string;
  height?: number | string;
  style?: any;
}

/**
 * Componente reutilizável para renderizar assets SVG a partir de XML string.
 * Usado para renderizar os SVGs exportados do Figma fielmente.
 */
export default function SvgAsset({ xml, width, height, style }: SvgAssetProps) {
  return (
    <SvgXml
      xml={xml}
      width={width}
      height={height}
      style={style}
    />
  );
}
