#!/bin/sh
set -e

# Clear cached config so fresh Railway variables are used.
php artisan config:clear || true
php artisan cache:clear || true

# Run migrations on boot (idempotent).
php artisan migrate --force

# Start Laravel HTTP server on Railway-assigned port.
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
