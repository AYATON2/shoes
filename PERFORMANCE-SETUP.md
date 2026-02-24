# High Concurrency Setup Guide - HTTP/3 Support for 50+ Users

This guide will help you configure your StepUp Footwear system to handle 50+ concurrent users with HTTP/3 (QUIC) support for maximum performance.

## Table of Contents
1. [Server Requirements](#server-requirements)
2. [Install Redis](#install-redis)
3. [Configure Nginx with HTTP/3](#configure-nginx-with-http3)
4. [Optimize PHP-FPM](#optimize-php-fpm)
5. [Configure Laravel](#configure-laravel)
6. [Database Optimization](#database-optimization)
7. [Enable OPcache](#enable-opcache)
8. [Deploy and Test](#deploy-and-test)

---

## 1. Server Requirements

### Minimum Specifications for 50+ Concurrent Users:
- **CPU**: 4 cores (8 recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: SSD with 50GB+ available
- **Network**: 100Mbps+ bandwidth
- **OS**: Ubuntu 20.04 LTS or higher

### Required Software:
- Nginx 1.25+ (with QUIC/HTTP3 support)
- PHP 8.0+ with FPM
- MySQL 8.0+ or MariaDB 10.5+
- Redis 6.0+
- Composer 2.0+
- Node.js 16+ and npm

---

## 2. Install Redis

Redis is crucial for caching, sessions, and queue management.

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Configure Redis for Production:
Edit `/etc/redis/redis.conf`:
```conf
# Increase max memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Enable persistence
save 900 1
save 300 10
save 60 10000

# TCP backlog
tcp-backlog 511

# Disable RDB compression for speed (if you have space)
rdbcompression no

# Enable append-only file
appendonly yes
appendfsync everysec
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

### Install PHP Redis Extension:
```bash
sudo apt install php-redis php-igbinary -y
sudo systemctl restart php8.0-fpm
```

---

## 3. Configure Nginx with HTTP/3

### Install Nginx with QUIC Support:

**Option A: Build from source with QUIC**
```bash
# Install dependencies
sudo apt install build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev libgd-dev -y

# Clone nginx with QUIC
cd /tmp
git clone --recursive https://github.com/cloudflare/quiche
git clone https://github.com/nginx/nginx.git
cd nginx

# Configure with QUIC support
./auto/configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-http_v3_module \
    --with-openssl=../quiche/quiche/deps/boringssl \
    --with-quiche=../quiche

# Build and install
make
sudo make install
```

**Option B: Use Pre-built Binary (easier)**
```bash
# Add Nginx mainline repository (may have QUIC)
sudo add-apt-repository ppa:ondrej/nginx-mainline
sudo apt update
sudo apt install nginx -y

# Check if HTTP/3 is supported
nginx -V 2>&1 | grep -o 'http_v3'
```

### Configure Nginx:
Copy the provided configuration:
```bash
sudo cp nginx-http3.conf /etc/nginx/sites-available/shoes
sudo ln -s /etc/nginx/sites-available/shoes /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### Get SSL Certificate (Required for HTTP/3):
```bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or use self-signed for testing
sudo mkdir -p /etc/ssl/private
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/yourdomain.key \
  -out /etc/ssl/certs/yourdomain.crt
```

### Update nginx-http3.conf:
1. Replace `yourdomain.com` with your actual domain
2. Update SSL certificate paths
3. Update PHP-FPM socket path if different

### Enable and Test:
```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 4. Optimize PHP-FPM

Edit `/etc/php/8.0/fpm/pool.d/www.conf`:

```conf
; Process manager settings
pm = dynamic
pm.max_children = 100
pm.start_servers = 20
pm.min_spare_servers = 10
pm.max_spare_servers = 30
pm.max_requests = 500

; Performance tuning
pm.process_idle_timeout = 10s
request_terminate_timeout = 60s

; Enable status page
pm.status_path = /fpm-status

; Optimize socket
listen.backlog = 511
```

Edit `/etc/php/8.0/fpm/php.ini`:
```ini
; Memory and execution
memory_limit = 256M
max_execution_time = 60
max_input_time = 60

; OPcache (add these in next section)
; Upload limits
upload_max_filesize = 100M
post_max_size = 100M

; Session handling with Redis
session.save_handler = redis
session.save_path = "tcp://127.0.0.1:6379?database=3"

; Realpath cache
realpath_cache_size = 4096K
realpath_cache_ttl = 600
```

Restart PHP-FPM:
```bash
sudo systemctl restart php8.0-fpm
```

---

## 5. Enable OPcache

OPcache dramatically improves PHP performance by caching compiled code.

Edit `/etc/php/8.0/fpm/conf.d/10-opcache.ini`:
```ini
[opcache]
; Enable OPcache
opcache.enable=1
opcache.enable_cli=1

; Memory configuration
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000

; Validation (disable in production for speed)
opcache.validate_timestamps=0
opcache.revalidate_freq=0

; Performance
opcache.fast_shutdown=1
opcache.save_comments=1

; JIT (PHP 8.0+)
opcache.jit_buffer_size=100M
opcache.jit=1255
```

Restart PHP-FPM:
```bash
sudo systemctl restart php8.0-fpm
```

---

## 6. Configure Laravel

### Update Environment File:
```bash
cd /var/www/shoes
cp .env.production .env
```

Edit `.env` and update:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL` to your domain
- Database credentials
- Redis settings (usually defaults work)

### Install PHP Dependencies:
```bash
composer install --no-dev --optimize-autoloader
```

### Optimize Laravel:
```bash
# Generate app key if not set
php artisan key:generate

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create symbolic link for storage
php artisan storage:link

# Run migrations
php artisan migrate --force

# Create cache table (if using database cache as backup)
php artisan cache:table
php artisan session:table
php artisan queue:table
php artisan queue:failed-table
php artisan migrate
```

### Set Proper Permissions:
```bash
sudo chown -R www-data:www-data /var/www/shoes
sudo chmod -R 755 /var/www/shoes
sudo chmod -R 775 /var/www/shoes/storage
sudo chmod -R 775 /var/www/shoes/bootstrap/cache
```

### Start Queue Worker (for background jobs):
Create systemd service at `/etc/systemd/system/shoes-queue.service`:
```ini
[Unit]
Description=Shoes Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/shoes
ExecStart=/usr/bin/php /var/www/shoes/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable shoes-queue
sudo systemctl start shoes-queue
```

---

## 7. Database Optimization

### MySQL Configuration for Concurrency:
Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# Connection settings
max_connections = 200
max_user_connections = 0
thread_cache_size = 100
table_open_cache = 4000
table_definition_cache = 2000

# Buffer sizes
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
innodb_log_buffer_size = 64M
innodb_flush_log_at_trx_commit = 2

# Query cache (for MySQL 5.7, removed in 8.0)
# query_cache_type = 1
# query_cache_size = 128M

# Performance
innodb_flush_method = O_DIRECT
innodb_io_capacity = 2000
innodb_read_io_threads = 4
innodb_write_io_threads = 4

# Connection timeout
wait_timeout = 300
interactive_timeout = 300
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### Create Database Indexes:
Run these queries to optimize common lookups:
```sql
USE edoy_db;

-- Index for products
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);

-- Index for orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Index for order items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_sku ON order_items(sku_id);

-- Index for SKUs
CREATE INDEX idx_skus_product ON skus(product_id);
```

---

## 8. Deploy and Test

### Build React Frontend:
```bash
cd frontend
npm install
npm run build

# Copy build to Laravel public
cp -r build/* ../public/frontend/
```

### Clear All Caches:
```bash
cd /var/www/shoes
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Test HTTP/3:
```bash
# Using curl with HTTP/3
curl -I --http3 https://yourdomain.com

# Or using browser developer tools
# Chrome: chrome://flags/#enable-quic
# Firefox: about:config -> network.http.http3.enabled
```

### Performance Testing:
```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test with 50 concurrent users
ab -n 1000 -c 50 https://yourdomain.com/api/products

# Or use wrk for better HTTP/2+ testing
sudo apt install wrk -y
wrk -t4 -c50 -d30s https://yourdomain.com/api/products
```

### Monitor Performance:
```bash
# Redis monitor
redis-cli monitor

# MySQL slow query log
sudo tail -f /var/log/mysql/slow-query.log

# Nginx access log
sudo tail -f /var/log/nginx/shoes_access.log

# PHP-FPM status
curl http://localhost/fpm-status

# System resources
htop
```

---

## Performance Benchmarks

With these optimizations, you should see:

- **Response Time**: < 100ms for cached requests
- **Throughput**: 500+ requests/second
- **Concurrent Users**: 100+ simultaneous connections
- **Memory Usage**: ~2-4GB under load
- **CPU Usage**: < 70% with 50 concurrent users
- **Cache Hit Rate**: > 80% for product listings

---

## Troubleshooting

### High Memory Usage:
- Reduce PHP-FPM `pm.max_children`
- Reduce Redis `maxmemory`
- Check for memory leaks in code

### Slow Responses:
- Check database indexes: `EXPLAIN SELECT ...`
- Monitor Redis: `redis-cli --latency`
- Enable query logging: `DB_LOG_QUERIES=true`

### HTTP/3 Not Working:
- Verify Nginx compiled with `--with-http_v3_module`
- Check UFW/firewall allows UDP 443: `sudo ufw allow 443/udp`
- Ensure SSL certificates are valid
- Check browser supports HTTP/3

### Queue Not Processing:
- Check queue worker: `sudo systemctl status shoes-queue`
- View failed jobs: `php artisan queue:failed`
- Retry failed jobs: `php artisan queue:retry all`

---

## Monitoring and Maintenance

### Setup Cron Jobs:
```bash
sudo crontab -e -u www-data
```

Add:
```cron
# Laravel Scheduler
* * * * * cd /var/www/shoes && php artisan schedule:run >> /dev/null 2>&1

# Clear expired cache daily at 3am
0 3 * * * cd /var/www/shoes && php artisan cache:prune >> /dev/null 2>&1

# Restart queue worker daily at 4am
0 4 * * * sudo systemctl restart shoes-queue >> /dev/null 2>&1
```

### Log Rotation:
Create `/etc/logrotate.d/shoes`:
```conf
/var/www/shoes/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## Security Recommendations

1. **Firewall**: Only open ports 80, 443 (TCP/UDP), 22
2. **SSH**: Use key-based authentication only
3. **Database**: Don't expose MySQL externally
4. **Redis**: Bind to localhost only
5. **Updates**: Keep all packages updated
6. **Backups**: Daily database and file backups
7. **SSL**: Use strong TLS 1.3 ciphers only
8. **Rate Limiting**: Already configured in Nginx

---

## Production Checklist

- [ ] Redis installed and running
- [ ] Nginx with HTTP/3 configured
- [ ] SSL certificates installed
- [ ] PHP-FPM optimized
- [ ] OPcache enabled
- [ ] Database indexes created
- [ ] Laravel optimized (config, route, view cache)
- [ ] Queue worker running
- [ ] Cron jobs configured
- [ ] Monitoring setup
- [ ] Backups automated
- [ ] Firewall configured
- [ ] Performance tested with 50+ users

---

## Support and Resources

- **Nginx HTTP/3 Docs**: https://nginx.org/en/docs/http/ngx_http_v3_module.html
- **Laravel Performance**: https://laravel.com/docs/deployment#optimization
- **Redis Best Practices**: https://redis.io/docs/manual/config/
- **MySQL Tuning**: https://dev.mysql.com/doc/refman/8.0/en/optimization.html

---

**Last Updated**: February 2026
**Version**: 1.0.0
