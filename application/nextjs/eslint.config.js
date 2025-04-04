import baseConfig, { restrictEnvAccess } from '@acme/eslint-config/base';
import nextjsConfig from '@acme/eslint-config/nextjs';
import reactConfig from '@acme/eslint-config/react';
import tailwindConfig from '@acme/eslint-config/tailwind';

export default [
  {
    ignores: ['.next/**'],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
  ...tailwindConfig,
];
