#!/usr/bin/env bash
# One-time setup for the Oracle Always Free VM (Ubuntu 22.04/24.04).
# Installs Docker, Node 24 and pm2, and opens TCP 6380 (Redis TLS) in the
# VM's own iptables. Port 6380 must also be opened in the Oracle Security List.
set -euo pipefail

sudo apt-get update
sudo apt-get install -y ca-certificates curl git openssl netfilter-persistent iptables-persistent

# Docker
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

# Node 24 + pm2
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 24 ]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo npm install -g pm2

# Oracle's Ubuntu images end INPUT with a REJECT rule; insert 6380 before it.
if ! sudo iptables -C INPUT -p tcp --dport 6380 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 6380 -j ACCEPT
  sudo netfilter-persistent save
fi

# Small swap so npm ci does not run out of memory on the 1 GB shape.
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
  sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "Done. Log out and back in so the docker group applies."
