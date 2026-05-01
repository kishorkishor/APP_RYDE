module.exports = {
  apps: [
    {
      name: 'ryde-backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      listen_timeout: 10000,
      watch: false,
    },
  ],
};
