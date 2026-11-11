#!/usr/bin/env bash
# Database and photo backup. Run from the repository's Docker host.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
timestamp="$(date +%Y%m%d-%H%M%S)"
target="${1:-backups}/kleiderpfad-${timestamp}"
mkdir -p "$target"
echo "Backing up PostgreSQL..."
docker compose exec -T db pg_dump -U kleiderpfad -d kleiderpfad -Fc > "$target/database.dump"
echo "Backing up private uploads..."
docker compose cp app:/data/uploads "$target/uploads"
echo "Creating checksums..."
(cd "$target" && find . -type f -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
echo "Backup saved to: $target"
echo "For consistency, avoid photo uploads while this backup is running."
