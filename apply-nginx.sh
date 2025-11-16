#!/bin/bash
echo "Применение NGINX конфигурации..."
ssh -p 3022 -t ubuntu@193.111.11.98 << 'ENDSSH'
sudo mv /tmp/nginx-vazifa-final /etc/nginx/sites-available/vazifa
sudo nginx -t
sudo systemctl reload nginx
echo "✅ NGINX обновлен!"
pm2 list
ENDSSH
