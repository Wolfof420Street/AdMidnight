import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@admidnight/shared$': '<rootDir>/../../packages/shared/src',
    '^@admidnight/midnight-sdk-wrapper$': '<rootDir>/../../packages/midnight-sdk-wrapper/src',
  },
  collectCoverageFrom: ['src/**/*.ts'],
};

export default config;

