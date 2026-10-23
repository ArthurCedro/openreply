#!/usr/bin/env bash
# Generates users.acl with a random password for the "openreply" user.
# Prints the password once; it is never written anywhere else.
set -euo pipefail
cd "$(dirname "$0")"

if [ -f users.acl ]; then
  echo "users.acl already exists; delete it first to rotate the password." >&2
  exit 1
fi

PASS="$(openssl rand -hex 32)"
umask 077
cat > users.acl <<EOF
user default off
user healthcheck on >healthcheck -@all +ping
user openreply on >${PASS} ~* &* +@all -flushall -flushdb -config -shutdown -debug -keys -save -bgsave -bgrewriteaof -replicaof -slaveof -module -acl -monitor -failover -migrate -restore
EOF
# The container's redis user (uid 999) must be able to read it.
chmod 644 users.acl

echo "Redis password for user 'openreply' (store it in your password manager):"
echo "${PASS}"
