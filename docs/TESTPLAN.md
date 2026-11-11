# Manuelles End-to-End-Testprotokoll

Diese Tests müssen an einer echten Testinstanz mit vorhandenem Authentik, NPM und PostgreSQL durchgeführt werden. GitHub Actions deckt derzeit Build und Datenbankschema ab, **keine echten OIDC-Sessions**.

## Testdaten vorbereiten
- Zwei Authentik-Nutzer A und B (optional dritter Nutzer C)
- Zwei Haushalte A und B
- Je ein Foto mit EXIF-Daten und eines ohne EXIF
- 3–5 Kleidungsstücke, z. B. Body 62, Jacke 68, Hose 68

## Authentifizierung
- [ ] Nutzer A kann sich anmelden/abmelden; Session bleibt nach Reload erhalten.
- [ ] Nutzer B meldet sich an und bekommt einen separaten Haushalt.
- [ ] Ein Benutzer erhält ohne Anmeldung keinen Zugriff auf private Bilder.
- [ ] NPM-HTTPS/Redirect und Authentik-Callback sind korrekt.

## Familien und Kontakte
- [ ] A erstellt einen Einladungscode, B kann ihn einmal verwenden.
- [ ] Der Code ist danach nicht mehr verwendbar.
- [ ] B kann den aktiven Haushalt wechseln.
- [ ] A sendet eine Kontaktanfrage an einen separaten Haushalt B.
- [ ] A kann die eigene Anfrage nicht selbst bestätigen.
- [ ] B bestätigt die Anfrage; beide sehen Verbindung als aktiv.

## Kleider
- [ ] A erfasst einen Body mit Größe 62 und Foto.
- [ ] Liste filtert nach Text, Größe, Zustand und Status.
- [ ] A bearbeitet Zustand und Notizen.
- [ ] JPG/PNG/WebP werden verarbeitet; zu große Dateien werden abgewiesen.
- [ ] Foto ist ohne gültige Session nicht zugänglich.

## Schenkungspaket
- [ ] A erstellt ein Paket, fügt 2 Teile hinzu, entfernt eines und fügt es wieder hinzu.
- [ ] A sendet das Paket an verbundenen Haushalt B.
- [ ] Die Kleidungsstücke bleiben bei A, bis B bestätigt.
- [ ] A kann ein abgesendetes Paket nicht verändern.
- [ ] B sieht Paketinhalt einschließlich Fotos.
- [ ] B nimmt das Paket an; alle Artikel wechseln gemeinsam Eigentümer und Aufbewahrer.
- [ ] A sieht das Kleidungsstück im Weitergabe-Verlauf.
- [ ] C (unbeteiligt) kann Details und Fotos nicht lesen.

## Leihgabe
- [ ] A verleiht ein Paket an B.
- [ ] Nach Annahme ist A Eigentümer und B Aufbewahrer.
- [ ] B bestätigt Rückgabe; alle Teile sind wieder bei A.
- [ ] Eine zweite Rückgabe derselben Leihgabe wird verhindert.

## Fehler und Rennen
- [ ] Ein Kleidungsstück kann nicht in zwei gleichzeitig offene Übergaben versendet werden.
- [ ] Zwei parallele Annahmen ändern Bestand nicht doppelt.
- [ ] Archivierung während offener Übergabe wird verhindert.
- [ ] Abgelehntes Paket verändert Besitzer nicht.
- [ ] Browser-Refresh nach einer Aktion erzeugt keine zweite Übergabe.

## Betrieb
- [ ] `/api/health` ist erreichbar.
- [ ] Datenbank und Bilder lassen sich sichern und in einer Testinstanz wiederherstellen.
- [ ] Smartphone-Fotoaufnahme und PWA-Verknüpfung auf iOS und Android testen.
