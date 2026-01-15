module.exports = {
  apps: [{
    name: 'vazifa-frontend',
    script: './server.js',
    cwd: '/var/www/vazifa/frontend',
    instances: 1,
    exec_mode: 'fork',
    interpreter: 'node',
    node_args: '--max-old-space-size=1024',
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
    max_memory_restart: '1G',
    exp_backoff_restart_delay: 100,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
