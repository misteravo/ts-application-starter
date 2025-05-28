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

  webpack: (config, { webpack }) => {
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^pg-native$|^cloudflare:sockets$/ }));
    return config;
  },
};

export default config;
