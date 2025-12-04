import baseConfig from '@acme/eslint-config/base';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
  ...baseConfig,
];
