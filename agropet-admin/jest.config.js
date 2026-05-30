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
    '!src/db/schema.ts',
    '!src/data/datasources/supabase/client.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/mocks/',
  ],
};
