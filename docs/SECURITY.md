# Sicherheit und Datenschutz

- **Anmeldung:** Authentik über OIDC; die Anwendung speichert kein Benutzerpasswort.
- **Mandantenfähigkeit:** Aktionen prüfen die serverseitige Mitgliedschaft am aktiven Haushalt.
- **Private Bilder:** Abruf nur für aktuelle oder direkt/historisch beteiligte Haushalte bzw. angebotene Empfänger. Keine öffentlichen Upload-Pfade.
- **Bild-Upload:** Maximale Dateigröße 10 MB; serverseitige Decodierung, Pixel-Limit, Rotation, JPEG-Reencode (EXIF wird entfernt), zufälliger Dateiname.
- **Sichere Übergaben:** Ein Paket wird beim Absenden gesperrt. Annahme und Rückgabe erfolgen mit Transaktionen und Zeilensperren.
- **Verlauf:** Früher beteiligte Haushalte behalten Zugriff auf den Artikelverlauf; Namen nicht unmittelbar beteiligter Haushalte werden in der Anzeige anonymisiert. Dieses Modell vor einer größeren öffentlichen Veröffentlichung nochmals mit den Nutzern abstimmen.
- **Betrieb:** HTTPS über bestehenden NPM, Authentik mit MFA, Firewall, DB nur auf internem Docker-Netz, Backup von Datenbank und Fotos.
- **Secrets:** Nur in .env; Repository enthält lediglich .env.example. Vor öffentlichem Hosting OIDC-Redirect, Enrollment und Session-Einstellungen prüfen.

## Noch offen
- E2E-Berechtigungsprüfungen mit mehreren Authentik-Nutzern
- Rate-Limits für Einladungen/Uploads/Verbindungsanfragen
- Nutzerfreundliche Lösch- und Datenschutzfunktionen
- Umfangreiche Browser- und Mobiltests
