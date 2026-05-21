#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${BACKEND_URL:?Set BACKEND_URL on the frontend service (public backend URL)}"

# Убрать кавычки/пробелы и хвостовой /
BACKEND_URL=$(printf '%s' "$BACKEND_URL" | tr -d '"' | tr -d "'" | sed 's/[[:space:]]//g' | sed 's#/*$##')

# nginx требует схему http:// или https://
case "$BACKEND_URL" in
  http://*|https://*) ;;
  *)
    BACKEND_URL="https://${BACKEND_URL}"
    ;;
esac

export PORT BACKEND_URL
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "nginx: PORT=${PORT} BACKEND_URL=${BACKEND_URL}"
exec "$@"
