module.exports = {
  apps: [{
    name: 'vazifa-frontend',
    script: './server.js',
    cwd: '/var/www/vazifa/frontend',
    instances: 1,
    exec_mode: 'fork',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ubuntu/.pm2/logs/vazifa-frontend-error.log',
    out_file: '/home/ubuntu/.pm2/logs/vazifa-frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    exp_backoff_restart_delay: 100
  }]
};
