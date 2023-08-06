module.exports = {
  apps: [
    {
      name: 'local-service',
      script: './dist/index.js',
      env: {
        NODE_ENV: 'production',
        NODE_PATH: 'dist/',
        ENV: 'production',
        LOG_LEVEL: 'info',
        PORT: 5556,
        PRINTERS: 'tcp://192.168.1.234:9100',
        STORE_ID: 1,
        JOB_INTERVAL_MS: 500,
      },
    },
  ],
}
