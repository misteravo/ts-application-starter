import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  compress: false,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ['@acme/backend', '@acme/ui'],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  /** Handle native modules */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'better-sqlite3': false,
      };
    }
    config.externals = [...(config.externals || []), 'better-sqlite3'];
    return config;
  },
};

export default config;
