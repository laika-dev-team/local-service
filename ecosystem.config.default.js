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
        STAMP_PRINTERS: 'tcp://192.168.1.100:9100',
        INTERNAL_ACECSS_KEY: '',
        NATS_ENDPOINT: '127.0.0.1:4222',
        STORE_ID: 1,
        JOB_INTERVAL_MS: 500,
      },
    },
  ],
}
