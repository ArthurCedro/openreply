#!/usr/bin/env bash
# Generates users.acl with two least-privilege users and random passwords:
#   worker - used only on the VM via 127.0.0.1:6379 (BullMQ worker, rate limiter)
#   vercel - used from Vercel via TLS :6380, limited to the queue and health keys
# Prints the passwords once; they are never written anywhere else.
set -euo pipefail
cd "$(dirname "$0")"

if [ -f users.acl ]; then
  echo "users.acl already exists; delete it first to rotate the passwords." >&2
  exit 1
fi

WORKER_PASS="$(openssl rand -hex 32)"
VERCEL_PASS="$(openssl rand -hex 32)"
DENY="-flushall -flushdb -config -shutdown -debug -keys -save -bgsave -bgrewriteaof -replicaof -slaveof -module -acl -monitor -failover -migrate -restore -sync -psync"

umask 077
cat > users.acl <<EOF
user default off
user worker on >${WORKER_PASS} ~* &* +@all ${DENY}
user vercel on >${VERCEL_PASS} ~bull:dm-processing:* ~health:worker:dm ~alerts:worker:dm &bull:dm-processing:* +@all -@dangerous ${DENY} +info +client|setname +client|getname +client|id +client|setinfo
EOF
# The container's redis user (uid 999) must be able to read it.
chmod 644 users.acl

echo "Redis password for user 'worker' (VM .env only):"
echo "${WORKER_PASS}"
echo "Redis password for user 'vercel' (Vercel REDIS_URL only):"
echo "${VERCEL_PASS}"
