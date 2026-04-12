FROM php:8.2-cli

# Install system packages and PHP extensions needed by Laravel.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring bcmath exif zip \
    && rm -rf /var/lib/apt/lists/*

# Install Composer.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy app source.
COPY . .

# Install PHP dependencies for production.
RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

# Ensure writable directories are available for Laravel.
RUN chmod -R 775 storage bootstrap/cache

EXPOSE 8080

CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8080}"]
