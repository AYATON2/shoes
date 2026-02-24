#!/bin/bash

# StepUp Footwear - Quick Performance Setup Script
# This script automates the basic setup for high-concurrency production deployment

set -e

echo "=========================================="
echo "StepUp Footwear Performance Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get actual user running sudo
ACTUAL_USER=${SUDO_USER:-$USER}

# Configuration
PROJECT_PATH="/var/www/shoes"
PHP_VERSION="8.0"
DOMAIN=""

# Ask for domain
read -p "Enter your domain name (e.g., example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "Domain name is required!"
    exit 1
fi

echo ""
echo "Starting setup for domain: $DOMAIN"
echo "Project path: $PROJECT_PATH"
echo ""

# Update system
echo "[1/10] Updating system packages..."
apt update && apt upgrade -y

# Install Redis
echo "[2/10] Installing Redis..."
apt install redis-server -y
systemctl enable redis-server
systemctl start redis-server

# Configure Redis
echo "[3/10] Configuring Redis..."
cat >> /etc/redis/redis.conf <<EOF

# Performance optimizations
maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-backlog 511
appendonly yes
appendfsync everysec
EOF

systemctl restart redis-server

# Install PHP Redis extension
echo "[4/10] Installing PHP Redis extension..."
apt install php${PHP_VERSION}-redis php${PHP_VERSION}-igbinary -y

# Optimize PHP-FPM
echo "[5/10] Optimizing PHP-FPM..."
cat > /etc/php/${PHP_VERSION}/fpm/pool.d/www.conf <<EOF
[www]
user = www-data
group = www-data
listen = /var/run/php/php${PHP_VERSION}-fpm.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = dynamic
pm.max_children = 100
pm.start_servers = 20
pm.min_spare_servers = 10
pm.max_spare_servers = 30
pm.max_requests = 500
pm.process_idle_timeout = 10s

request_terminate_timeout = 60s
pm.status_path = /fpm-status
listen.backlog = 511
EOF

# Enable OPcache
echo "[6/10] Enabling OPcache..."
cat > /etc/php/${PHP_VERSION}/fpm/conf.d/10-opcache.ini <<EOF
[opcache]
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.revalidate_freq=0
opcache.fast_shutdown=1
opcache.save_comments=1
opcache.jit_buffer_size=100M
opcache.jit=1255
EOF

systemctl restart php${PHP_VERSION}-fpm

# Install Nginx (if not installed)
echo "[7/10] Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt install nginx -y
fi

# Configure Nginx site
echo "[8/10] Configuring Nginx for $DOMAIN..."
sed "s/yourdomain.com/$DOMAIN/g" ${PROJECT_PATH}/nginx-http3.conf > /etc/nginx/sites-available/shoes
ln -sf /etc/nginx/sites-available/shoes /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Get SSL Certificate
echo "[9/10] Setting up SSL..."
read -p "Do you want to install Let's Encrypt SSL certificate? (y/n): " INSTALL_SSL

if [ "$INSTALL_SSL" == "y" ]; then
    apt install certbot python3-certbot-nginx -y
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --register-unsafely-without-email
else
    echo "Creating self-signed certificate for testing..."
    mkdir -p /etc/ssl/private
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/${DOMAIN}.key \
        -out /etc/ssl/certs/${DOMAIN}.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
fi

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Configure Laravel
echo "[10/10] Configuring Laravel..."
cd ${PROJECT_PATH}

# Copy production environment
if [ ! -f .env ]; then
    cp .env.production .env
    
    # Generate app key
    sudo -u www-data php artisan key:generate
fi

# Install dependencies
echo "Installing Composer dependencies..."
sudo -u www-data composer install --no-dev --optimize-autoloader

# Laravel optimizations
echo "Optimizing Laravel..."
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

# Set permissions
echo "Setting file permissions..."
chown -R www-data:www-data ${PROJECT_PATH}
chmod -R 755 ${PROJECT_PATH}
chmod -R 775 ${PROJECT_PATH}/storage
chmod -R 775 ${PROJECT_PATH}/bootstrap/cache

# Create queue worker service
echo "Setting up queue worker..."
cat > /etc/systemd/system/shoes-queue.service <<EOF
[Unit]
Description=Shoes Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${PROJECT_PATH}
ExecStart=/usr/bin/php ${PROJECT_PATH}/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable shoes-queue
systemctl start shoes-queue

# Add cron job for Laravel scheduler
echo "Setting up cron jobs..."
(crontab -u www-data -l 2>/dev/null; echo "* * * * * cd ${PROJECT_PATH} && php artisan schedule:run >> /dev/null 2>&1") | crontab -u www-data -

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit ${PROJECT_PATH}/.env and update:"
echo "   - Database credentials"
echo "   - APP_URL=https://$DOMAIN"
echo "   - Redis settings (if needed)"
echo ""
echo "2. Run database migrations:"
echo "   cd ${PROJECT_PATH}"
echo "   php artisan migrate --force"
echo ""
echo "3. Build frontend:"
echo "   cd ${PROJECT_PATH}/frontend"
echo "   npm install && npm run build"
echo "   cp -r build/* ../public/frontend/"
echo ""
echo "4. Test your site: https://$DOMAIN"
echo ""
echo "5. Test HTTP/3:"
echo "   curl -I --http3 https://$DOMAIN"
echo ""
echo "6. Performance test:"
echo "   ab -n 1000 -c 50 https://$DOMAIN/api/products"
echo ""
echo "Logs:"
echo "  - Nginx: /var/log/nginx/shoes_*.log"
echo "  - PHP-FPM: /var/log/php${PHP_VERSION}-fpm.log"
echo "  - Laravel: ${PROJECT_PATH}/storage/logs/laravel.log"
echo "  - Queue: sudo journalctl -u shoes-queue -f"
echo ""
echo "Service Management:"
echo "  - Queue Worker: sudo systemctl status shoes-queue"
echo "  - Restart Queue: sudo systemctl restart shoes-queue"
echo ""
echo "For detailed setup instructions, see:"
echo "  ${PROJECT_PATH}/PERFORMANCE-SETUP.md"
echo ""
echo "=========================================="
