# Kleidolino – Technische Integration ins bestehende Next.js-Projekt

Dieses Dokument beschreibt die Übernahme des Markendesigns. **Aktuell heißt das Repository weiterhin `KleiderPfad`.** Branding-Assets unter `docs/` allein benennen weder das Repository noch die laufende Anwendung um.

## 1. Vorbereitung

Vor Implementierung die aktuellen Dateien prüfen:

- `src/app/layout.tsx` und `public/manifest.webmanifest` für App-Metadaten
- `src/components/AppShell.tsx` für Navigation und Header
- `src/app/globals.css` für bestehende CSS-Tokens
- `src/components/ui/*` für vorhandene Komponenten
- `src/app/wardrobe/page.tsx` und `src/app/packages/[id]/page.tsx` für Produkt- und Paketlisten
- `docs/DESIGN_IMPLEMENTATION_KNUSPR.md` für die vollständige Interaktionsspezifikation

## 2. Branding technisch einbinden

1. SVGs gezielt in `public/brand/` übernehmen, z. B.:
   - `assets/logos/primary-horizontal.svg` → `public/brand/logo.svg`
   - `assets/logos/symbol.svg` → `public/brand/symbol.svg`
   - `assets/logos/app-icon.svg` → `public/brand/icon.svg`
2. Eine Datei `src/styles/kleidolino-tokens.css` aus `docs/corporate-design/tokens.css` verwenden bzw. deren Tokens in bestehende Variablen mappen. Keine konkurrierenden CSS-Werte.
3. Für den App-Header `/brand/logo.svg` oder kompakte Variante einbauen. Für < 340 px die Wortmarke verkleinern, nicht abschneiden.
4. `src/app/layout.tsx` aktualisieren:
   - `title: "Kleidolino"`
   - `description`: Familien-App zum Verwalten und Weitergeben von Kinderkleidung
   - Open Graph `/brand/share-og.png` oder aus SVG abgeleitet
   - Theme Color passend zur Primärfarbe
5. `public/manifest.webmanifest` aktualisieren (`name`, `short_name`, Icons). App-Icon-PNGs via Raster-Workflow erzeugen.
6. Echte UI-Fotos weiterhin privat über `/api/photos/[id]`; nicht öffentlich in `public/brand` ausgeben.

## 3. Komponenten-Mapping

| Oberfläche | Brand-Assets | Umsetzung |
|---|---|---|
| Login/Startseite | Primärlogo, `desktop-hero.svg` | freundlich, helle Fläche, klarer Sign-in-CTA |
| Mobile Navigation | `ui/navigation.svg` (Referenz) | tatsächliche Interaktion via Lucide/React |
| Kleiderschrank | `ui/product-card.svg` (Referenz) | Produktkarten mit echten Fotos und sichtbaren Zuständen |
| Pakete | `illustrations/package-heart.svg` | leere Zustände oder Erfolgsansicht |
| Historie | `icons/history.svg`, Herz/Spur | vertikale Event-Timeline |
| Empty State | `illustrations/clothes-set.svg` | CTA zur Erfassung |
| Übergabebestätigung | `illustrations/package-heart.svg` | erst nach tatsächlicher Freigabe Bestätigung melden |
| Marketing / Social | `social/*.svg` | nur öffentliche nicht-personenbezogene Inhalte |

Die App-Mockups unter `assets/mockups/` sind **Illustrationen, keine implementierten React-Bildschirme**. Stil und Layout daraus nachbauen, nicht gesamte Mockup-SVGs als interaktive UI ausgeben.

## 4. Priorisierte Entwicklungsphasen

### Phase A – Name und Design-Tokens
- [ ] App-Name in UI, Manifest, Metadata, Accessibility Labels, E-Mail/Notifications aktualisieren.
- [ ] Brand-Logo und App-Icon nutzen.
- [ ] Tokens zentralisieren, bestehende Funktions-CSS nicht unkontrolliert überschreiben.
- [ ] CI `npm run typecheck`, `npm run build`.

### Phase B – Kleiderschrank
- [ ] große quadratische Produktbilder; `object-fit: contain`.
- [ ] Zustandsbadges und kompakte Filterchips.
- [ ] bestehende Kategorie-/condition-Trennung und URL-State gemäß Knuspr-Leitfaden korrigieren/erhalten.
- [ ] responsive Grid, Kartenaktionen und Barrierefreiheit.

### Phase C – Paketkorb
- [ ] Auswahl per Plus-/Check-Button in Produktkarte, serverseitige Validierung.
- [ ] feste Auswahlleiste oberhalb Mobile Navigation.
- [ ] Paketerstellung und Übergabe gemäß existierender Transaktionslogik.

### Phase D – Zusätzliche Ansichten
- [ ] Startseite, Paketübergaben, Detail-/Verlaufsseite, Familienbereich visuell angleichen.
- [ ] Eingehende Übergaben und Rückgaben klar unterscheiden.
- [ ] keine Interaktionsregression bei Authentik, Einladungen und Upload.

### Phase E – Qualität und Veröffentlichung
- [ ] 320/390/768/1024/1440 px Screenshots vergleichen.
- [ ] Safari iOS, Chrome Android, Desktop, Tastatur testen.
- [ ] Layout-Shift, Safe Areas, Kontrast und Fokus prüfen.
- [ ] Snapshot/Browser-Checks und vorhandene Datenbanktests laufen lassen.
- [ ] Nur funktionsfähige Änderungen nach `main` mergen.

## 5. Docker/CI unverändert lassen

- Bereits bestehende Authentik- und NPM-Instanzen weiterverwenden.
- `.env` bleibt **ausschließlich auf dem Server**; nicht in Git committen.
- PostgreSQL-/Foto-Volumes nicht entfernen oder neu erstellen.
- CI-/Deployment-Workflow nur gezielt erweitern.

## 6. OpenCode-Arbeitsauftrag

> Übernimm das Branding **Kleidolino** anhand `docs/corporate-design/README.md`, `BRAND_GUIDE.md`, `WEB_IMPLEMENTATION.md` und `DESIGN_TOKENS.json`. Setze das Logo, Farbpalette und Typografie in der bestehenden Next.js-App um. Arbeite anschließend die UI-/UX-Verbesserungen aus `docs/DESIGN_IMPLEMENTATION_KNUSPR.md` phasenweise ab. Die SVGs im Corporate-Design-Ordner sind freigegebene Gestaltungsmaster. Nutze echte interaktive Komponenten statt Mockups als Screenshot. Achte auf Responsivität, Screenreader und sichere Haushaltstrennung. Ändere nicht ungefragt Authentik/NPM, die `.env` oder die bestehenden Datenbank-/Foto-Volumes. Führe nach jeder Phase Typecheck, Build und Tests aus.
