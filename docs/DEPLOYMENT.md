# KleiderPfad – Docker-Deployment mit bestehendem Authentik & NPM

## Voraussetzungen
- Docker Engine + Docker Compose
- Laufender **Authentik**-Server mit HTTPS
- Laufender **Nginx Proxy Manager** (NPM)
- Öffentliche oder interne HTTPS-Domain für KleiderPfad
- Persistente Docker-Volumes für PostgreSQL und Bilder

## 1. Repository vorbereiten

```bash
git clone https://github.com/Motrish/KleiderPfad.git
cd KleiderPfad
cp .env.example .env
openssl rand -hex 24    # Beispiel für DB_PASSWORD
openssl rand -base64 32 # Beispiel für AUTH_SECRET
```

In `.env` setzen:
- `DB_PASSWORD`: starkes Passwort **ohne URL-Sonderzeichen** (hexadezimal empfohlen)
- `AUTH_SECRET`: zufälliges langes Geheimnis
- `AUTH_URL`: HTTPS-URL deiner KleiderPfad-Domain
- `AUTH_TRUST_HOST=true`
- `AUTH_AUTHENTIK_ID`, `AUTH_AUTHENTIK_SECRET`: aus dem Authentik-Provider
- `AUTH_AUTHENTIK_ISSUER`: exakt aus der Authentik-OIDC-Discovery (Slash beachten)
- `APP_BIND_IP`: Adresse, auf der der Docker-Host die App bereitstellen soll

## 2. Authentik

Neue Anwendung mit OAuth2/OIDC-Provider erstellen (Confidential Client), Claims `openid profile email`.
Redirect URI: `https://<deine-domain>/api/auth/callback/authentik`.

Authentik weiterhin separat betreiben. KleiderPfad legt bei der ersten Anmeldung automatisch ein lokales Benutzerprofil und den ersten Haushalt an. Für zusätzliche Nutzer sind Authentik-Accounts erforderlich. Ein KleiderPfad-Haushaltseinladungscode erstellt **keinen** Authentik-Account.

## 3. Netzwerk / NPM

`docker-compose.yml` bindet die App zunächst an `127.0.0.1:3100`; das ist für einen Reverse Proxy **auf dem Host selbst** nutzbar, nicht automatisch für einen NPM-Docker-Container.

Wenn NPM in einem anderen Container bzw. auf einem anderen Host läuft, `APP_BIND_IP` auf die **private LAN-IP des Docker-Hosts** setzen und den Port `3100` nur aus dem NPM-Netz erlauben. Alternativ kann die App manuell in ein gemeinsames Docker-Proxy-Netz eingebunden und über ihren Containernamen adressiert werden.

NPM Proxy Host konfigurieren:
- Domain: KleiderPfad-Domain
- Scheme: http
- Forward Host: IP/Name aus obiger Netzkonfiguration
- Port: 3100 (Host-Port)
- TLS-Zertifikat und HTTPS-Redirect aktivieren

## 4. Deployment

```bash
docker compose up -d --build
docker compose exec app npm run db:push
docker compose ps
```

`db:push` nur zum initialen Schemaaufbau und in der Entwicklungsphase verwenden. Im späteren Produktivbetrieb Schemaänderungen durch geprüfte SQL-Migrationen durchführen.

Danach `https://<deine-domain>/api/health` öffnen, Login testen und mit einem zweiten Benutzer ein Kontakt-/Paketszenario prüfen.

## 5. Backup

Vor größeren Updates stets **Datenbank UND Bilder** sichern:

```bash
mkdir -p backups
docker compose exec -T db pg_dump -U kleiderpfad -d kleiderpfad -Fc > backups/kleiderpfad.dump
docker compose cp app:/data/uploads backups/uploads
```

`docker compose cp` sichert den aktuellen Bilderstand. Für konsistente Vollbackups während laufender Uploads zuvor Schreibaktivität anhalten bzw. einen Wartungsmodus verwenden. Wiederherstellung mit `pg_restore` und Rückkopieren der Fotodateien zunächst in einer Testinstanz prüfen.

## 6. Prüfungen

```bash
docker compose logs --tail=100 app
docker compose logs --tail=100 db
docker compose exec app npm run typecheck
```

GitHub Actions führt bei jedem Push Build- und Datenbank-Smoketests aus. Reale OIDC-End-to-End-Tests sind davon nicht abgedeckt.

## 7. Bekannte Grenzen

- Noch keine automatische Registrierung neuer Authentik-Accounts über Einladungen.
- Echte Mehrbenutzer- und Mobiltests stehen aus.
- Eine Offline-Nutzung ohne Server ist noch nicht implementiert.
