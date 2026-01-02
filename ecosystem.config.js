/**
 * PM2 Ecosystem File
 * Use: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'sync-server',
      script: './sync-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads', 'tickets-data.json']
    }
  ]
};


