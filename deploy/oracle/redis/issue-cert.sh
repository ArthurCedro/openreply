#!/usr/bin/env bash
# Issues a Let's Encrypt certificate for the DuckDNS hostname via DNS-01 and
# installs it into ./tls. acme.sh renews it automatically (cron) and re-runs
# the install step, which restarts Redis so it picks up the new certificate.
#
# Usage: DUCKDNS_TOKEN=... ./issue-cert.sh openreply-redis.duckdns.org you@example.com
set -euo pipefail
cd "$(dirname "$0")"

DOMAIN="${1:?hostname, e.g. openreply-redis.duckdns.org}"
EMAIL="${2:?email for Let's Encrypt expiry notices}"
: "${DUCKDNS_TOKEN:?export DUCKDNS_TOKEN first}"

if [ ! -x "$HOME/.acme.sh/acme.sh" ]; then
  curl -fsSL https://get.acme.sh | sh -s email="$EMAIL"
fi
ACME="$HOME/.acme.sh/acme.sh"

export DuckDNS_Token="$DUCKDNS_TOKEN"
"$ACME" --issue --server letsencrypt --dns dns_duckdns -d "$DOMAIN" --dnssleep 60

mkdir -p tls
DIR="$(pwd)"
"$ACME" --install-cert -d "$DOMAIN" \
  --fullchain-file "$DIR/tls/fullchain.pem" \
  --key-file "$DIR/tls/privkey.pem" \
  --reloadcmd "chmod 644 $DIR/tls/*.pem && cd $DIR && (docker compose restart redis || true)"

echo "Certificate installed in $DIR/tls"
