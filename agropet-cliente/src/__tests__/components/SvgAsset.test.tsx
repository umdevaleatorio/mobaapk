import React from 'react';
import { render } from '@testing-library/react-native';
import SvgAsset from '../../presentation/components/SvgAsset';

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  SvgXml: ({ xml, width, height, style }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement('Text', { testID: 'mock-svg-xml', xml, width, height, style }, 'SvgXmlMock');
  },
}));

describe('SvgAsset', () => {
  it('should render SvgXml with given xml, width, height and style', () => {
    const mockXml = '<svg><rect/></svg>';
    const mockStyle = { margin: 10 };
    const { getByTestId } = render(
      <SvgAsset xml={mockXml} width={50} height={100} style={mockStyle} />
    );

    const svg = getByTestId('mock-svg-xml');
    expect(svg.props.xml).toBe(mockXml);
    expect(svg.props.width).toBe(50);
    expect(svg.props.height).toBe(100);
    expect(svg.props.style).toEqual(mockStyle);
  });
});
