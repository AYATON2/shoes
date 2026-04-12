#!/bin/sh
set -u

echo "[startup] Booting Laravel container"
echo "[startup] APP_ENV=${APP_ENV:-unset}"
echo "[startup] APP_URL=${APP_URL:-unset}"
echo "[startup] DB_HOST=${DB_HOST:-unset}"
echo "[startup] DB_PORT=${DB_PORT:-unset}"
echo "[startup] DB_DATABASE=${DB_DATABASE:-unset}"
echo "[startup] DB_USERNAME=${DB_USERNAME:-unset}"

# Quick DB connectivity probe for deploy logs.
php -r '
$h=getenv("DB_HOST") ?: "";
$p=getenv("DB_PORT") ?: "3306";
$d=getenv("DB_DATABASE") ?: "";
$u=getenv("DB_USERNAME") ?: "";
$pw=getenv("DB_PASSWORD") ?: "";
if (!$h || !$d || !$u) {
	fwrite(STDOUT, "[startup] DB probe skipped: missing DB vars\n");
	exit(0);
}
try {
	$pdo = new PDO("mysql:host={$h};port={$p};dbname={$d}", $u, $pw, [PDO::ATTR_TIMEOUT => 5]);
	fwrite(STDOUT, "[startup] DB probe success\n");
} catch (Throwable $e) {
	fwrite(STDOUT, "[startup] DB probe failed: " . $e->getMessage() . "\n");
}
' || true

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
