# Architektur

Vorhandener Nginx Proxy Manager für HTTPS, vorhandener Authentik für OIDC. Neue Docker-Container: Next.js-App und PostgreSQL. Keine erneute Installation von Authentik oder NPM.

## Fachliche Regeln
- Ein physisches Kleidungsstück = eine UUID.
- Eigentümer und aktueller Besitzer getrennt speichern.
- Haushalt ist Berechtigungsgrenze; jede API-Abfrage prüft Mitgliedschaft.
- Übergaben nur nach Bestätigung und als atomare Transaktion.
- Ereignishistorie fortschreiben statt überschreiben.

## API (geplant, nicht implementiert)
- GET/POST /api/items
- GET/PATCH /api/items/:id
- POST /api/items/:id/photos
- GET /api/items/:id/events
- GET/POST /api/packages
- POST /api/packages/:id/submit
- POST /api/transfers/:id/accept
- POST /api/transfers/:id/decline
- GET/POST /api/households
