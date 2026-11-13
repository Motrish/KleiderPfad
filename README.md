# KleiderPfad

**Kleine Kleidung. Große Geschichten.**

Mobile-First-Web-App für Baby- und Kinderkleidung: Fotografieren, erfassen, innerhalb der Familie verwalten, Pakete schnüren, verleihen oder verschenken und die Geschichte jedes Kleidungsstücks nachverfolgen.

> **Status:** Frühes MVP / Entwicklung. Die Kernfunktionen sind implementiert. Automatische TypeScript-, Build- und Datenbankschema-Prüfungen laufen über GitHub Actions. Echte OIDC-/Multiuser-End-to-End-Tests und ein vollständiger Produktionstest stehen aus.

## Funktionen

- **Kleiderschrank:** Fotoerfassung, Art/Größe/Zustand/Herkunft, Bearbeiten, Archivieren, Suche
- **Private Bilder:** serverseitig skalieren, EXIF entfernen, nur berechtigt abrufbar
- **Haushalte:** mehrere Mitglieder mit Rollen, Einladungscode, Haushalt wechseln
- **Kontakte:** andere Haushalte über deren Kennung einladen und Anfrage bestätigen
- **Pakete:** erstellen, Kleidungsstücke hinzufügen/entfernen, gesammelt versenden
- **Übergaben:** Empfänger akzeptiert/ablehnt; erst Annahme verändert den Bestand
- **Verleihen:** Eigentümer und aktueller Aufbewahrer bleiben getrennt; Rückgabe möglich
- **Artikelhistorie:** Verlauf bleibt auch nach einer Schenkung zugänglich
- **Benachrichtigungen:** Kontaktanfragen und Paketstatus
- **PWA:** Manifest und App-Symbol, für mobile Browser optimiert

## Stack

Next.js 16 · React · TypeScript · Auth.js + **bestehender Authentik** · PostgreSQL + Drizzle · Docker Compose · **bestehender Nginx Proxy Manager**.

**Neu benötigte Docker-Container: 2** (App und Datenbank). Authentik und NPM gehören nicht zum Stack.

## Installation

```bash
git clone https://github.com/Motrish/KleiderPfad.git
cd KleiderPfad
cp .env.example .env
# .env mit Authentik-Client-ID, Secret, Issuer, Domain und DB-Passwort bearbeiten
docker compose up -d --build
docker compose exec app npm run db:push
```

Die Einrichtung der Authentik-Anwendung, die NPM-Erreichbarkeit und alle Umgebungsvariablen stehen in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). **Niemals die echten Secrets committen.**

## Mobile Navigation

- `/` Übersicht
- `/wardrobe` Kleiderschrank und Suche
- `/wardrobe/new` erfassen
- `/wardrobe/history` frühere Übergaben
- `/packages` Pakete
- `/transfers` erhalten, annehmen, zurückgeben
- `/family` Haushalte, Einladungen, Kontakte
- `/notifications` Meldungen

## Automatische Updates

Ein [Deploy-Skript mit systemd-Timer oder optionalem GitHub-SSH-Workflow](docs/AUTO_DEPLOY.md) hält den Server auf dem Stand von `main`. Die lokale `.env` bleibt auf dem Server, Datenbank- und Foto-Volumes bleiben bestehen.

## Qualität

GitHub Actions führt `npm run typecheck`, `npm run build`, einen Schemaabgleich mit temporärem PostgreSQL und Datenbankschema-Tests aus. Der CI-Erfolg bedeutet **nicht**, dass echte Authentik-Anmeldungen und Paketübergaben mit mehreren Nutzern bereits durchgetestet sind.

## Entwicklung

```bash
npm install
npm run dev
npm run typecheck
npm run db:generate
```

Für lokalen Betrieb ohne Docker benötigt `DATABASE_URL` eine erreichbare PostgreSQL-Instanz. `db:push` ist für einen erstmaligen Test/Entwicklungsbetrieb gedacht; spätere Schemaänderungen sollten nachvollziehbare Migrationen verwenden.

## Dokumentation

- [Deployment](docs/DEPLOYMENT.md)
- [Architektur](docs/ARCHITECTURE.md)
- [Datenmodell](docs/DATA_MODEL.md)
- [Sicherheit](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
- [Sitemap](docs/SITEMAP.md)
- [Testplan](docs/TESTPLAN.md)
- [Knuspr-inspirierter Design-/UX-Implementierungsleitfaden](docs/DESIGN_IMPLEMENTATION_KNUSPR.md)

## Designentscheidungen

- Jedes physische Kleidungsstück hat dauerhaft dieselbe ID, unabhängig von der Weitergabe.
- Für eine Leihgabe ändern sich nur Aufbewahrer und Ereignisverlauf, nicht der Eigentümer.
- Paketannahmen sind atomare Datenbanktransaktionen mit Zeilensperren.
- Authentik ist ausschließlich für Identität/Login zuständig; Zugriffsrechte liegen in der App.
- Fotos liegen auf einem eigenen persistenten Docker-Volume.

Noch keine Lizenz ausgewählt.


## Kleidolino Corporate Design

- [Kleidolino Corporate Design – Logo, Farben, Brand-Kit und Assets](docs/corporate-design/README.md)
