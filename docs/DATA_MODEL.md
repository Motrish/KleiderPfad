# PostgreSQL-Datenmodell

Quelle der Wahrheit: [src/db/schema.ts](../src/db/schema.ts).

| Tabelle | Zweck |
|---|---|
| `users` | OIDC-Identität, Anzeigename, E-Mail; Eindeutigkeit aus Issuer und Subject |
| `households` | Eigenständige Haushalte und gemeinsame Kleiderschränke |
| `household_members` | Mitgliedschaft, Rollen owner/admin/member |
| `household_invites` | Zeitlich begrenzte, einmal nutzbare Einladungscodes |
| `connections` | Kontaktanfragen zwischen zwei Haushalten; Initiator separat |
| `items` | Einzelne physische Kleidungsstücke mit Herkunft, Größe, Zustand, Eigentümer und Aufbewahrer |
| `item_photos` | Referenzen auf privat gespeicherte JPEGs |
| `packages` | Entwürfe und abgeschlossene Paketcontainer |
| `package_items` | Zuordnung Kleidungsstück–Paket |
| `transfers` | Anfrage, Annahme, Schenkung/Leihe, Rückgabe, Empfänger |
| `item_events` | Historische Ereignisse am Kleidungsstück |
| `notifications` | Benachrichtigungen pro Benutzer |
| `categories` | Vorbereitetes Kategorienschema (noch nicht an Formulare gebunden) |

## Schenkung
1. Eigentümer erstellt Paket im Status `draft`.
2. Eingefügte Teile müssen im Bestand des Absenders liegen.
3. Nach `sendPackage` hat Paket Status `submitted`, Übergabe Status `pending`; Eigentümer bleibt unverändert.
4. Annahme sperrt Transfer- und Item-Zeilen, prüft Eigentum/Status, aktualisiert Eigentümer und Aufbewahrer auf Empfänger, schreibt Ereignisse und Benachrichtigungen.
5. Ablehnung verändert Artikel nicht.

## Leihgabe
- Bei Annahme wird nur `holder_household_id` geändert, der ursprüngliche `owner_household_id` bleibt erhalten.
- Rückgabe setzt den Aufbewahrer auf den Eigentümer zurück, setzt `returned_at` und protokolliert Ereignisse.

## Verlauf
Jede Übergabe verweist auf ein eigenes Transferobjekt. Die Kombination aus `item_events`, `transfers` und `households` macht frühere Übergaben nachvollziehbar. Ehemals beteiligte Haushalte können den Artikel wiederfinden; später beteiligte, fremde Haushalte werden in der Ansicht anonymisiert.

## Fachliche Einschränkungen
- Keine Parallelübergabe eines Artikels aus mehreren Paketen.
- Paketinhalt nach Absenden nicht veränderbar.
- Übergabe nur zwischen bestätigten Kontakten.
- Paketannahme/Rückgabe ausschließlich in einer Datenbanktransaktion.
- Aufbewahrung außerhalb bestätigter Übergaben wird nicht automatisch geändert.

Vor einer breiteren Veröffentlichung noch erforderlich: vollständige Integrationstests und überprüfte SQL-Constraints für alle Statusübergänge.
