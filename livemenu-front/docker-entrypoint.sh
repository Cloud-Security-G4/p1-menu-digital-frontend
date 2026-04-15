#!/bin/sh
set -e

: "${PORT:=8080}"
: "${API_PORT:=80}"

# Renderiza la plantilla nginx con variables dinámicas
envsubst '$PORT $API_PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
