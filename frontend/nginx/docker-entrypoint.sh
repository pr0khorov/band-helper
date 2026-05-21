#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${BACKEND_URL:?Set BACKEND_URL to your backend public URL, e.g. https://xxx.up.railway.app}"

export PORT BACKEND_URL
envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
