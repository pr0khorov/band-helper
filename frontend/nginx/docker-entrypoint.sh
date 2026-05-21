#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${BACKEND_URL:?Set BACKEND_URL on the frontend service}"

BACKEND_URL=$(printf '%s' "$BACKEND_URL" | tr -d '"' | tr -d "'" | sed 's/[[:space:]]//g' | sed 's#/*$##')

# Внутренняя сеть Railway: только http, не https
case "$BACKEND_URL" in
  *.railway.internal)
    BACKEND_URL=$(echo "$BACKEND_URL" | sed 's|^https://|http://|')
    ;;
  http://*|https://*) ;;
  *)
    BACKEND_URL="https://${BACKEND_URL}"
    ;;
esac

export PORT BACKEND_URL
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

echo "nginx: PORT=${PORT} BACKEND_URL=${BACKEND_URL}"
exec "$@"
