import tailwindcssPlugin from 'eslint-plugin-tailwindcss';

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      tailwindcss: tailwindcssPlugin,
    },
    rules: {
      'tailwindcss/no-custom-classname': ['error', { whitelist: ['toaster'] }],
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/classnames-order': 'warn',
    },
    settings: {
      tailwindcss: {
        callees: ['cn'],
        classRegex: '^className$',
      },
    },
  },
];
