#!/bin/bash
set -e

echo "=== ummah Directory Server Setup ==="

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Setup firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create app directory
mkdir -p /opt/ummah-directory
mkdir -p /opt/ummah-directory/data/{postgres,redis,traefik}
mkdir -p /opt/ummah-directory/backups

echo "=== Setup complete ==="
echo "Next: Copy your project files to /opt/ummah-directory"
echo "Then: cd /opt/ummah-directory && docker-compose -f docker-compose.prod.yml up -d"
