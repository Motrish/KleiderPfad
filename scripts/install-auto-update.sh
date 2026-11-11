#!/usr/bin/env bash
# Install a 60-second systemd timer to deploy changes without inbound SSH.
set -Eeuo pipefail
if [[ "$EUID" == "0" ]]; then
  echo "Run this script as your normal Docker user (not with sudo)." >&2
  exit 1
fi

REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
DEPLOY_USER="$(id -un)"

if [[ ! "$REPO_DIR" =~ ^/[a-zA-Z0-9_./-]+$ ]]; then
  echo "Repository path contains unsupported characters. Use a path without spaces." >&2
  exit 1
fi
[[ -f "$REPO_DIR/.env" ]] || { echo "Missing .env in $REPO_DIR" >&2; exit 1; }
command -v sudo >/dev/null || { echo "sudo is required." >&2; exit 1; }
command -v systemctl >/dev/null || { echo "systemd is required." >&2; exit 1; }
docker info >/dev/null || { echo "Current user must be able to run Docker without sudo." >&2; exit 1; }
docker compose version >/dev/null || { echo "Docker Compose v2 is required." >&2; exit 1; }

sudo tee /etc/systemd/system/kleiderpfad-update.service >/dev/null <<EOF
[Unit]
Description=KleiderPfad: check GitHub main and rebuild Docker app when updated
Wants=network-online.target docker.service
After=network-online.target docker.service

[Service]
Type=oneshot
User=$DEPLOY_USER
WorkingDirectory=$REPO_DIR
ExecStart=/bin/bash $REPO_DIR/scripts/deploy-on-push.sh
TimeoutStartSec=0
StandardOutput=journal
StandardError=journal
EOF

sudo tee /etc/systemd/system/kleiderpfad-update.timer >/dev/null <<'EOF'
[Unit]
Description=KleiderPfad automatic GitHub update check every minute

[Timer]
OnBootSec=40s
OnUnitInactiveSec=60s
AccuracySec=5s
Unit=kleiderpfad-update.service

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now kleiderpfad-update.timer
echo "Timer installed. Running the first update check..."
sudo systemctl start kleiderpfad-update.service
echo
echo "Check status:"
echo "  systemctl status kleiderpfad-update.timer"
echo "  journalctl -u kleiderpfad-update.service -n 80 --no-pager"
