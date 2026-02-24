# Windows Development Setup for High Performance

This guide helps you test the performance optimizations on your Windows development machine before deploying to production Linux server.

## Prerequisites

- Windows 10/11
- WSL2 (Windows Subsystem for Linux)
- Docker Desktop for Windows (alternative)
- Git Bash or PowerShell

## Option 1: Using WSL2 (Recommended)

WSL2 gives you a full Linux environment on Windows with near-native performance.

### 1. Install WSL2

```powershell
# Run in PowerShell as Administrator
wsl --install

# Or install Ubuntu specifically
wsl --install -d Ubuntu-22.04

# Restart your computer
```

### 2. Setup Ubuntu in WSL2

```bash
# Open WSL2 (Ubuntu)
wsl

# Update packages
sudo apt update && sudo apt upgrade -y

# Install PHP 8.0
sudo apt install php8.0 php8.0-fpm php8.0-mysql php8.0-xml php8.0-mbstring php8.0-curl php8.0-zip php8.0-gd -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install MySQL
sudo apt install mysql-server -y
sudo service mysql start

# Install Redis
sudo apt install redis-server -y
sudo service redis-server start

# Install PHP Redis extension
sudo apt install php8.0-redis -y
```

### 3. Clone Your Project

```bash
# Navigate to your Windows folders (accessible via /mnt/c/)
cd /mnt/c/footware/shoes

# Or clone fresh
git clone https://github.com/AYATON2/shoes.git
cd shoes
```

### 4. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
cd frontend
npm install
cd ..
```

### 5. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env with nano or vim
nano .env

# Update these settings:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edoy_db
DB_USERNAME=root
DB_PASSWORD=

# For development, you can use file cache
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file

# Or test with Redis
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 6. Setup Database

```bash
# Start MySQL
sudo service mysql start

# Create database
mysql -u root -p
```

```sql
CREATE DATABASE edoy_db;
EXIT;
```

```bash
# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database (if you have seeders)
php artisan db:seed
```

### 7. Start Development Servers

```bash
# Terminal 1: Laravel Backend
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2: React Frontend
cd frontend
npm start

# Terminal 3: Queue Worker (if using Redis queues)
php artisan queue:work
```

Access your app:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

---

## Option 2: Using Docker Desktop

Docker provides containerized environment with all dependencies.

### 1. Install Docker Desktop

Download from: https://www.docker.com/products/docker-desktop

### 2. Create Docker Compose File

Create `docker-compose.dev.yml` in your project root:

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: edoy_db
    volumes:
      - mysql_data:/var/lib/mysql

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # PHP Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - .:/var/www/shoes
    depends_on:
      - mysql
      - redis
    environment:
      DB_HOST: mysql
      REDIS_HOST: redis

volumes:
  mysql_data:
```

### 3. Create Development Dockerfile

Create `Dockerfile.dev`:

```dockerfile
FROM php:8.0-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/shoes

COPY . .

RUN composer install

CMD php artisan serve --host=0.0.0.0 --port=8000
```

### 4. Start Docker Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
docker-compose exec app php artisan migrate

# View logs
docker-compose logs -f app
```

---

## Option 3: Native Windows (XAMPP/WAMP)

### 1. Install XAMPP

Download from: https://www.apachefriends.org/

### 2. Install Composer

Download from: https://getcomposer.org/download/

### 3. Install Node.js

Download from: https://nodejs.org/

### 4. Install Redis for Windows

Download from: https://github.com/microsoftarchive/redis/releases

Or use Memurai (Redis-compatible): https://www.memurai.com/

### 5. Configure XAMPP

1. Start Apache and MySQL from XAMPP Control Panel
2. Create database using phpMyAdmin (http://localhost/phpmyadmin)

### 6. Setup Project

```bash
# In Git Bash or PowerShell
cd C:\xampp\htdocs
git clone https://github.com/AYATON2/shoes.git
cd shoes

# Install dependencies
composer install
cd frontend
npm install
cd ..

# Configure environment
copy .env.example .env
# Edit .env with your settings

# Generate key and migrate
php artisan key:generate
php artisan migrate
```

### 7. Enable Redis Extension

1. Download `php_redis.dll` for your PHP version
2. Copy to `C:\xampp\php\ext\`
3. Edit `C:\xampp\php\php.ini`:
   ```ini
   extension=redis
   ```
4. Restart Apache

---

## Testing Performance Optimizations

### 1. Test Without Redis (Baseline)

`.env`:
```env
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
```

```bash
# Test response time
curl -w "@curl-format.txt" http://localhost:8000/api/products
```

Create `curl-format.txt`:
```
     time_total:  %{time_total}s\n
```

### 2. Test With Redis (Optimized)

Start Redis:
```bash
# WSL2
sudo service redis-server start

# Docker
docker-compose up -d redis

# Windows (Memurai)
# Start from Start Menu
```

`.env`:
```env
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Clear cache:
```bash
php artisan cache:clear
php artisan config:cache
```

Test again:
```bash
curl -w "@curl-format.txt" http://localhost:8000/api/products
```

### 3. Test Response Caching

```bash
# First request (MISS)
curl -I http://localhost:8000/api/products | grep "X-Cache"

# Second request (HIT)
curl -I http://localhost:8000/api/products | grep "X-Cache"
```

### 4. Load Testing

Install JMeter: https://jmeter.apache.org/download_jmeter.cgi

Or use a simple PowerShell script:

```powershell
# test-load.ps1
$requests = 100
$concurrent = 10
$url = "http://localhost:8000/api/products"

$jobs = 1..$concurrent | ForEach-Object {
    Start-Job -ScriptBlock {
        param($url, $count)
        $times = @()
        for ($i = 0; $i -lt $count; $i++) {
            $start = Get-Date
            Invoke-WebRequest -Uri $url -UseBasicParsing | Out-Null
            $end = Get-Date
            $times += ($end - $start).TotalMilliseconds
        }
        $times
    } -ArgumentList $url, ($requests / $concurrent)
}

$results = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

Write-Host "Total Requests: $requests"
Write-Host "Concurrent: $concurrent"
Write-Host "Average Time: $([math]::Round(($results | Measure-Object -Average).Average, 2))ms"
Write-Host "Min Time: $([math]::Round(($results | Measure-Object -Minimum).Minimum, 2))ms"
Write-Host "Max Time: $([math]::Round(($results | Measure-Object -Maximum).Maximum, 2))ms"
```

Run:
```powershell
.\test-load.ps1
```

---

## Monitoring Redis in Development

### Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Get all keys
KEYS *

# Monitor real-time commands
MONITOR

# Get info
INFO stats
INFO memory

# Clear all cache
FLUSHDB
```

### Redis GUI Tools

- **RedisInsight**: https://redis.com/redis-enterprise/redis-insight/
- **Another Redis Desktop Manager**: https://github.com/qishibo/AnotherRedisDesktopManager

---

## Common Issues on Windows

### Redis Not Starting (WSL2)
```bash
sudo service redis-server start
# Check status
sudo service redis-server status
```

### MySQL Not Starting (WSL2)
```bash
sudo service mysql start
# Check logs
sudo tail -f /var/log/mysql/error.log
```

### Port Already in Use
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill process by PID
taskkill /PID <PID> /F
```

### Permission Issues (WSL2)
```bash
# Fix permissions
sudo chown -R $USER:$USER /mnt/c/footware/shoes
chmod -R 755 /mnt/c/footware/shoes
```

### Composer Memory Limit
```bash
php -d memory_limit=-1 /usr/local/bin/composer install
```

---

## Next Steps

After testing locally:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add performance optimizations"
   git push origin main
   ```

2. **Deploy to Production**: Follow `PERFORMANCE-SETUP.md`

3. **Monitor Performance**: Use the monitoring tools from `OPTIMIZATION-SUMMARY.md`

---

## Quick Reference

### Start All Services (WSL2)
```bash
sudo service mysql start
sudo service redis-server start
php artisan serve
```

### Clear All Caches
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
redis-cli FLUSHDB
```

### Rebuild Optimizations
```bash
composer dump-autoload -o
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

For production deployment, see: **PERFORMANCE-SETUP.md**
