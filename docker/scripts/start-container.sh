#!/usr/bin/env bash
set -e

echo "Starting Laravel deployment..."

mkdir -p storage/app storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true

php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan cache:clear || true

php artisan migrate --force

php artisan config:cache
php artisan view:cache

apache2-foreground