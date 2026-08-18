#!/bin/sh
set -e

echo "[entrypoint] applying Prisma schema"
./node_modules/.bin/prisma db push --skip-generate

mkdir -p "${UPLOAD_DIR:-/data/uploads}"

exec "$@"
