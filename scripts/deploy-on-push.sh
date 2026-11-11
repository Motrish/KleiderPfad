#!/usr/bin/env bash
# KleiderPfad: deploy newest main commit, preserving local .env and volumes.
set -Eeuo pipefail

REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
cd "$REPO_DIR"
EXPECTED_SHA="${1:-}"
STATE_FILE="$REPO_DIR/.git/kleiderpfad-last-deployed"
LOCK_FILE="$REPO_DIR/.git/kleiderpfad-deploy.lock"

log() { printf '[%s] %s\n' "$(date -Is)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

[[ "$(git branch --show-current)" == "main" ]] || die "Checkout must be on main."
[[ -f .env ]] || die "Missing local .env; deployment stopped."
git check-ignore -q -- .env || die ".env is not ignored by Git!"
if git ls-files --error-unmatch -- .env >/dev/null 2>&1; then
  die ".env is tracked in Git; deployment stopped to protect secrets."
fi
[[ -f .dockerignore ]] && grep -Fqx '.env' .dockerignore ||
  die ".dockerignore must contain a line excluding .env."
command -v flock >/dev/null || die "flock is required (util-linux)."
command -v docker >/dev/null || die "Docker is required."
docker compose version >/dev/null || die "Docker Compose v2 is required."

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another deployment is already running; skipping."
  exit 0
fi

ENV_HASH="$(sha256sum .env | cut -d ' ' -f 1)"
log "Fetching latest origin/main..."
git fetch --quiet --no-tags origin +refs/heads/main:refs/remotes/origin/main
TARGET_SHA="$(git rev-parse --verify refs/remotes/origin/main)"
CURRENT_SHA="$(git rev-parse --verify HEAD)"
LAST_DEPLOYED="$(cat "$STATE_FILE" 2>/dev/null || true)"

if [[ -n "$EXPECTED_SHA" && "$EXPECTED_SHA" != "$TARGET_SHA" ]]; then
  log "Requested commit $EXPECTED_SHA is no longer latest; skipping. A later run will handle it."
  exit 0
fi
if [[ "$TARGET_SHA" == "$LAST_DEPLOYED" ]]; then
  log "Already deployed: $TARGET_SHA"
  exit 0
fi
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  die "Tracked files contain local changes; refusing to overwrite them. Local .env is unaffected."
fi
git merge-base --is-ancestor "$CURRENT_SHA" "$TARGET_SHA" ||
  die "Non-fast-forward update or local commits detected; refusing to overwrite history."

log "Updating sources from $CURRENT_SHA to $TARGET_SHA..."
git merge --ff-only "$TARGET_SHA"
[[ "$(sha256sum .env | cut -d ' ' -f 1)" == "$ENV_HASH" ]] ||
  die "Local .env changed during deployment; stopped."

log "Validating Compose configuration..."
docker compose config --quiet
log "Building application image..."
docker compose build app

log "Recreating app when needed and preserving existing volumes..."
docker compose up -d --no-build app

log "Checking app health..."
healthy=0
for attempt in $(seq 1 30); do
  if docker compose exec -T app node -e '
    fetch("http://127.0.0.1:3000/api/health")
      .then(r => { if (!r.ok) process.exit(1); })
      .catch(() => process.exit(1));
  ' >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep 2
done

if [[ "$healthy" != "1" ]]; then
  docker compose logs --tail=60 app >&2 || true
  die "Application health check failed. Last successful deployment marker was not changed."
fi

printf '%s\n' "$TARGET_SHA" > "$STATE_FILE.tmp"
mv -f "$STATE_FILE.tmp" "$STATE_FILE"
log "Deployment successful: $TARGET_SHA"
