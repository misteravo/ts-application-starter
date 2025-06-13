import baseConfig from '@acme/eslint-config/base';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: ['./tsconfig.json'],
      },
    },
  },
];
