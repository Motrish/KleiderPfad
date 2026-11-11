# Deployment

1. `.env.example` nach `.env` kopieren und Secrets und Domains anpassen.
2. In Authentik eine OAuth2/OIDC-Anwendung (Confidential Client) erstellen. Redirect URI: `https://<domain>/api/auth/callback/authentik`.
3. `docker compose up -d --build`.
4. `docker compose exec app npm run db:push` (nur in der frühen Entwicklung; später Migrationen verwenden).
5. NPM auf den Host-Port 3100 routen; HTTPS aktivieren.
6. `/api/health` und Login prüfen.

Der Port ist standardmäßig nur auf `127.0.0.1` gebunden. Bei einem Reverse Proxy auf einem anderen Rechner `APP_BIND_IP` auf eine geeignete private IP ändern und per Firewall einschränken.
