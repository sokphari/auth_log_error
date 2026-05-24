#!/usr/bin/env bash
set -e

echo "Starting Laravel deployment..."

mkdir -p storage/app/public
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache || true
chmod -R 777 storage bootstrap/cache || true

rm -f bootstrap/cache/*.php || true
rm -rf storage/framework/cache/data/* || true
rm -f storage/framework/views/*.php || true

php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

php artisan migrate --force

php artisan config:cache
php artisan view:cache

echo "Laravel started successfully."

apache2-foreground