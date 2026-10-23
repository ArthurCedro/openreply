#!/usr/bin/env bash
# One-time setup for the Oracle Always Free VM (Ubuntu 22.04/24.04).
# Installs Docker, Node 24 and pm2, adds swap, and throttles new connections to
# TCP 6380 (Redis TLS). Port 6380 itself is opened in the Oracle Security List.
# Works on x86_64 (E2.1.Micro) and arm64 (A1.Flex).
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

# Docker-published ports bypass the INPUT chain, so the Oracle Security List is
# the real gate for 6380. Here we only throttle new TLS connections per source
# IP in DOCKER-USER (the chain Docker leaves for user rules) to slow brute force.
sudo systemctl enable --now docker
if ! sudo iptables -C DOCKER-USER -p tcp -m conntrack --ctorigdstport 6380 --ctstate NEW \
    -m hashlimit --hashlimit-above 20/min --hashlimit-burst 40 --hashlimit-mode srcip \
    --hashlimit-name redis6380 -j DROP 2>/dev/null; then
  sudo iptables -I DOCKER-USER -p tcp -m conntrack --ctorigdstport 6380 --ctstate NEW \
    -m hashlimit --hashlimit-above 20/min --hashlimit-burst 40 --hashlimit-mode srcip \
    --hashlimit-name redis6380 -j DROP
  sudo netfilter-persistent save
fi

# Small swap so npm ci does not run out of memory on the 1 GB shape.
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
  sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "Done. Log out and back in so the docker group applies."
