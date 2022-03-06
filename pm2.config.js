module.exports = {
  apps: [
    {
      name: 'app',
      script: 'dist/src/main.js',
      instances: 2,
      env: {
        NODE_ENV: 'development',
        NODE_PATH: './dist',
      },
      env_production: {
        NODE_ENV: 'production',
        TZ: 'UTC',
      },
      exec_mode: 'cluster',
    },
  ],
};
