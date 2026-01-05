module.exports = {
  apps: [
    {
      name: 'myrec-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'myrec-cron',
      script: 'node',
      args: '--loader tsx scripts/cron.ts',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      cron_restart: '0 * * * *', // Restart hourly to prevent memory leaks
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/cron-err.log',
      out_file: './logs/cron-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
