#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${BACKEND_URL:?Set BACKEND_URL on the frontend service}"

BACKEND_URL=$(printf '%s' "$BACKEND_URL" | tr -d '"' | tr -d "'" | sed 's/[[:space:]]//g' | sed 's#/*$##')

# --- разбор BACKEND_URL ---
BACKEND_SCHEME=$(echo "$BACKEND_URL" | sed -n 's|^\(https\?\)://.*|\1|p')
BACKEND_REST=$(echo "$BACKEND_URL" | sed 's|^https\?://||')
BACKEND_HOST=$(echo "$BACKEND_REST" | sed 's|:.*||')
BACKEND_PORT=$(echo "$BACKEND_REST" | sed -n 's|^[^:]*:\([0-9]*\)$|\1|p')

if [ -z "$BACKEND_SCHEME" ]; then
  BACKEND_SCHEME=https
  BACKEND_HOST="$BACKEND_REST"
fi

# Внутренняя сеть Railway — только HTTP
case "$BACKEND_HOST" in
  *.railway.internal)
    BACKEND_SCHEME=http
    ;;
esac

if [ "$BACKEND_SCHEME" = "http" ] && [ -z "$BACKEND_PORT" ]; then
  BACKEND_PORT=8080
fi

if [ "$BACKEND_SCHEME" = "https" ] && [ -z "$BACKEND_PORT" ]; then
  BACKEND_PORT=443
fi

# --- nginx: для https нужен proxy_pass через переменную (SNI по hostname, не по IP) ---
if [ "$BACKEND_SCHEME" = "https" ]; then
  API_PROXY_BLOCK="
        resolver [fd12:8790:10a9:1001::1] 8.8.8.8 valid=10s ipv6=on;
        set \$backend_host \"${BACKEND_HOST}\";
        proxy_pass https://\$backend_host:${BACKEND_PORT}/api/;
        proxy_ssl_server_name on;
        proxy_ssl_name ${BACKEND_HOST};"
else
  API_PROXY_BLOCK="
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}/api/;"
fi

export PORT
cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen ${PORT};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    client_max_body_size 50m;

    location /api/ {
        ${API_PROXY_BLOCK}
        proxy_http_version 1.1;
        proxy_connect_timeout 30s;
        proxy_read_timeout 120s;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

echo "nginx: PORT=${PORT}"
echo "nginx: BACKEND=${BACKEND_SCHEME}://${BACKEND_HOST}:${BACKEND_PORT}"
exec "$@"
