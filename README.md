# KleiderPfad

**Kleine Kleidung. Große Geschichten.**

KleiderPfad ist eine selbst gehostete, mobile-first Web-App, mit der Familien Baby- und Kinderkleidung dokumentieren, verwalten, paketweise weitergeben oder verleihen und deren Geschichte nachverfolgen können.

> **Status:** Technischer Projektstart / Architektur- und Datenbankgerüst. Noch keine vollständige Kleiderverwaltung und keine produktive Freigabe.

## Technologie

- Next.js 16 (App Router), React, TypeScript
- Authentik via OpenID Connect (Auth.js)
- PostgreSQL + Drizzle ORM
- Docker Compose mit zwei Containern: App und Datenbank
- Bestehenden Nginx Proxy Manager verwenden (nicht Teil des Compose-Stacks)

## Schnellstart

1. `.env.example` nach `.env` kopieren und Werte eintragen.
2. In Authentik eine OAuth2/OpenID-Connect-Anwendung mit Confidential Client erstellen.
3. Redirect URI: `https://<deine-domain>/api/auth/callback/authentik` festlegen.
4. `docker compose up -d --build` ausführen.
5. Schema einmalig vorbereiten: `docker compose exec app npm run db:push`.
6. Nginx Proxy Manager auf Port `3100` oder auf das gemeinsame Docker-Netz routen.

Die Bind-Adresse ist standardmäßig `127.0.0.1`. Läuft Nginx Proxy Manager auf einem anderen Host, kann `APP_BIND_IP` an eine geeignete LAN-IP gebunden werden; Zugriff per Firewall beschränken.

## Umfang des Startgerüsts

- OIDC Login/Logout und authentifizierte Startansicht
- Grundlayout für die mobile Navigation
- Datenbankschema: Benutzer, Haushalte, Kleidung, Bilder, Pakete, Übergaben, Verbindungen, Ereignisverlauf
- Health-Endpunkt `GET /api/health`
- Dockerfile, Compose und Umgebungsvariablen
- Architektur, Roadmap und Sicherheitsregeln unter `docs/`

**Noch nicht implementiert:** Erfassung, Upload, Bearbeitung, Paketerstellung/Übergabe, Haushalts-Synchronisierung, Benutzerrechte, Einladungssystem und Benachrichtigungen. Die Datenbanktabellen und das Konzept bereiten diese Funktionen vor.

## Entwicklungsstart

```bash
npm install
npm run dev
```

Zum Datenbankabgleich während der Entwicklung: `npm run db:push`. Für spätere produktive Releases SQL-Migrationen mit `npm run db:generate` und `npm run db:migrate` erstellen/anwenden.

## Architekturprinzipien

- Identität liegt in Authentik; eigene Rechte gehören in KleiderPfad.
- Ein physisches Kleidungsstück erhält genau eine unveränderliche UUID.
- Eigentümer und aktueller Aufbewahrer werden getrennt gespeichert.
- Paketübergaben ändern den Bestand erst bei Bestätigung und stets atomar.
- Fotos werden außerhalb der Datenbank abgelegt; Zugriff später nur nach Rechteprüfung.
- Keine Geheimnisse in Git committen.

Mehr: [Architektur](docs/ARCHITECTURE.md) · [Datenmodell](docs/DATA_MODEL.md) · [Roadmap](docs/ROADMAP.md) · [Deployment](docs/DEPLOYMENT.md)

Lizenz noch nicht festgelegt.