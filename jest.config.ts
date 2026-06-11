import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/lib/__tests__/test-utils\\.ts$'],
};

export default createJestConfig(config);
