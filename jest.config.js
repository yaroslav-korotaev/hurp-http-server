module.exports = {
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/jest.setup.js',
  ],
  coverageReporters: ['lcov', 'text'],
  moduleFileExtensions: ['js', 'ts'],
  roots: ['<rootDir>/src'],
  setupTestFrameworkScriptFile: 'jest-extended',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
