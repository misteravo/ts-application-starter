module.exports = {
  apps: [
    {
      name: 'ts-application-starter',
      script: './application/nextjs/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
};
