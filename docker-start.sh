#!/bin/sh
set -u

echo "[startup] Booting Laravel container"

# Clear cached config so fresh Railway variables are used.
php artisan config:clear || true
php artisan cache:clear || true

# Run migrations on boot (idempotent).
if php artisan migrate --force; then
	echo "[startup] Migrations completed"
else
	echo "[startup] Migration failed, continuing startup so app stays reachable"
fi

# Start Laravel HTTP server on Railway-assigned port.
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
