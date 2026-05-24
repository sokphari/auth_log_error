#!/usr/bin/env bash
set -e

echo "Starting Laravel deployment..."

php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan cache:clear || true

php artisan migrate --force

php artisan config:cache
php artisan view:cache

apache2-foreground