module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest-setup.ts'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/src/__tests__/mocks/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/presentation/screens/auth/**',
    '!src/presentation/screens/client/**',
    '!src/presentation/screens/SplashScreen.tsx',
    '!src/db/schema.ts',
    '!src/domain/value-objects/index.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/mocks/',
  ],
};
