# KleiderPfad – Implementierungsleitfaden für das Knuspr-inspirierte UI/UX

> **Status:** Umsetzungsanleitung, **keine bereits implementierte Änderung**.  
> **Ziel:** Ein fotozentriertes, schnell bedienbares Kleiderverwaltungssystem mit der Übersichtlichkeit einer modernen Lebensmittel-/Shopping-App.  
> **Referenz:** https://www.knuspr.de/ (Inspiration für Interaktionsmuster; keine Übernahme geschützter Marken-, Layout- oder Bildassets).  
> **Technik:** Next.js 16 App Router, React 19, TypeScript, bestehende CSS-Tokens in \`src/app/globals.css\`, Lucide, Drizzle/PostgreSQL, Authentik-OIDC.

## 1. Zielbild

KleiderPfad soll sich auf dem Handy wie eine moderne Shopping-App anfühlen, **ohne Shop, Preise oder Kaufprozess**.

| Muster der Referenz | KleiderPfad-Entsprechung | Nutzermehrwert |
|---|---|---|
| Produktkachel mit großem Bild | Kleidungsstück-Karte | Kleidung auf einen Blick erkennen |
| Kategorieleiste | Bodys, Hosen, Jacken, Schuhe usw. | Schnelle Eingrenzung |
| Suchfeld und Filter | Typ, Marke, Größe, Zustand, Status, Farbe | Bestand rasch finden |
| Plus-Button an der Kachel | Teil zum Paketkorb auswählen | Weniger Seitenwechsel |
| Warenkorb | Paketkorb / Paketauswahl | Mehrere Teile gemeinsam weitergeben |
| Produktdetails | Foto, Größe, Herkunft, Eigentum, Lebenslauf | Verständliche Historie |
| Produkthighlights | Zuletzt erfasst, Nach Größe stöbern, Offene Übergaben | Startseite als Arbeitsfläche |
| Mobile Tab-Bar | Übersicht · Kleidung · (+) Erfassen · Pakete · Familie | Einhandbedienung |

**Leitidee:** Wenige Aktionen pro Kleidungsstück; die prominenteste Funktion ist **Erfassen**, die zweitwichtigste **Zum Paket hinzufügen**. Mehr Details sind zugänglich, dominieren aber nicht die Oberfläche.

### Bewusst *nicht* übernehmen

- Preise, Warenrabatte, Liefertermine, Checkout, Upselling, Werbebanner.
- Dauerhaft eingeblendete Pop-ups, die die Kleiderliste verdecken.
- Geschützte Produktfotos, Logos, Schriften oder Markenbegriffe von Knuspr.
- Neue Authentifizierung, neue Reverse-Proxy-Infrastruktur oder unnötige Datenbanktabellen für reine UI-Änderungen.

## 2. Ist-Stand und Code-Abgleich (vor Änderung erneut prüfen)

Stand beim Erstellen der Anleitung:

| Datei | Bereits vorhanden | Geplanter Eingriff |
|---|---|---|
| \`src/app/globals.css\` | Ausführliches Grün-/Mint-Token-System, Grid, Karten, Filterchips, Header, Sidebar, Mobile Nav | Bestehende Tokens wiederverwenden, fehlende Komponentenstile ergänzen; Dopplungen vermeiden |
| \`src/components/AppShell.tsx\` | Client-Komponente, Desktop-Sidebar, 5 mobile Navigationseinträge, Benachrichtigung | Mittiges \`+\` für Erfassung und Navigation mit sichtbarem Aktivzustand; Content- und Safe-Area-Abstand |
| \`src/app/page.tsx\` | Kennzahlen, Schnellzugriffe, Benachrichtigungen | Suche, Kategorien nach Größe, zuletzt erfasst, offene Übergaben |
| \`src/app/wardrobe/page.tsx\` | Produktraster, Suche, Chips | **Bugfix Kategorie/condition**, echte Filter, Auswahlaktionen, Paketkorb |
| \`src/app/wardrobe/new/NewItemForm.tsx\` | Kamera-/Galerieerfassung, Validierung und Formular | In Schrittfolge vereinfachen; vorhandenen funktionierenden Foto-Flow erhalten |
| \`src/app/wardrobe/[id]/page.tsx\` | Bilder, Details, Historie, Bearbeitung | Fotohero/-galerie, kompakte Informationsblöcke, Paket-Aktion |
| \`src/app/packages/page.tsx\` | Paketübersicht, Status und Einstieg | Als Paket-Hub visuell klarer, offene Entwürfe hervorheben |
| \`src/app/packages/[id]/page.tsx\` | Inhalt, Hinzufügen/Entfernen, Empfänger, Versenden | Paketkorb-Auswahl übernehmen, Vorschauraster und klare nächste Aktion |
| \`src/app/packages/new/page.tsx\` | Titel und Notiz zum Anlegen | Aus einer Vorauswahl heraus öffnbar und ausgewählte IDs übernehmen |
| \`src/app/family/page.tsx\` | Haushalte, Einladungen, Kontakte | Visuell angleichen, funktionale Logik unverändert |
| \`src/app/transfers/page.tsx\` | Eingehend/ausgehend, Annehmen/Ablehnen/Rückgabe | Statuskarten mit Fotos und klaren primären Aktionen |
| \`src/components/ui/*\` | Wiederverwendbare Buttons, Cards, Inputs, Modal, Toast, PhotoCapture | Reuse statt parallele Komponentenbibliothek |
| \`src/actions.ts\` | \`createItem\`, \`createPackage\`, \`addPackageItem\`, \`sendPackage\`, Transferaktionen | Servervalidierung für neue Auswahlflüsse, keine Rechte-Regression |

**Bekannter Fehler im aktuellen \`wardrobe/page.tsx\`:**

- Die Chip-Beschriftungen sind Kleidungsarten (z. B. \`Body\`), der Click-Code benutzt aber \`condition\`. \`condition\` ist für Werte wie \`good\`, \`new\` gedacht. **Neuen Filter \`category\` oder \`type\` einführen**, \`condition\` getrennt halten.
- Es werden \`onClick={() => window.location.href = ...}\` und \`window\` direkt in einer Server Component verwendet; das darf so nicht bleiben. Filterchips als \`<Link href={...}>\` rendern oder in eine kleine \`'use client'\`-Komponente auslagern. URL immer korrekt mit \`?\` und \`URLSearchParams\` erzeugen.
- Aktuell steht die Kleiderart als \`items.title\` in der Datenbank. Es gibt außerdem \`items.categoryId\` und \`categories\`, aber die Erfassung schreibt nicht zwingend \`categoryId\`. **Für Phase 1 vorhandene Werte von \`items.title\` normiert filtern** oder vor Einführung einer echten Kategorie-FK eine saubere Migration inkl. Backfill planen. Keine Datenbankmigration nur für visuelle Chips erzwingen.
- Das Repository enthält bereits ein eigenes UI-Redesign in \`tasks/mobile-optimization.md\` und \`tasks/plan.md\`: vorhandene Funktionen (Kamerafluss, Einladungslinks, mehrstufige Erfassung) nicht zurückbauen.

## 3. Designsystem – verbindliche Vorgaben

### 3.1 Farbe und Typografie

Die bestehende Farbwelt von KleiderPfad beibehalten; kein vollständiger Farbwechsel.

| Token / Bedeutung | Zielwert | Verwendung |
|---|---|---|
| \`--primary\` | \`#27AE70\` | Primärer CTA, aktive Chips, Erfolg |
| \`--primary-dark\` | \`#198754\` | Hover/Pressed und dunkler Kontrast |
| \`--primary-light\` | \`#E9F8EF\` | Soft Cards, Kategoriefelder |
| \`--bg\` | \`#F7F9F8\` | Seitenhintergrund |
| \`--bg-white\` | \`#FFFFFF\` | Karten, Bottom Bar |
| \`--text-primary\` | \`#222B26\` | Überschriften/Primärtext |
| \`--text-secondary\` | \`#78867E\` | Metadaten |
| \`--border\` | \`#E9EEEB\` | Kartenbegrenzungen |
| Warnung | vorhandene Status-Tokens | Verliehen / Übergabe offen |

- **Schrift:** Bestehende \`Inter\`-Konfiguration verwenden; Fallback System-UI.
- **Basistext:** 16 px; Labels 12–14 px; Screen-Titel 26–30 px.
- **Abstände:** 4-px-Raster; meist 8, 12, 16, 24 px.
- **Karten:** Border-Radius 14–18 px; einheitliche Bildradien, sehr leichte Schatten.
- **Buttons/Chips:** Touch-Fläche **mindestens 44 × 44 px**, bevorzugt 48 px.
- **Zustände:** Farbe nie als einziges Signal (immer Text + bei Bedarf Icon).
- **Fokus:** \`:focus-visible\` sichtbar; Kontrast für lesbaren Text nach WCAG AA prüfen.

**Nicht:** neue zufällige Hexwerte pro Komponente, schwere Schatten, kleine Icon-only-Klickflächen, Schriftgröße unter 12 px für wichtige Information.

### 3.2 Responsivität

| Breite | Layout |
|---|---|
| 320–479 px | Mobile, 2 Artikelspalten, seitliche 12–16 px, fixe Bottom-Navigation |
| 480–767 px | Mobile, 2 Spalten mit mehr Abstand; Filter als Bottom Sheet |
| 768–1023 px | Tablet, 3 Spalten sofern Karten mindestens 160 px bleiben |
| ab 1024 px | Desktop, vorhandene Sidebar, 3–5 Spalten im Content abhängig vom Platz |

Bilder auf Produktkarten standardmäßig **1:1** mit \`object-fit: contain\` auf ruhigem Hintergrund (keine abgeschnittenen Ärmel/Schuhe). Kein Horizontal-Scroll der ganzen Seite; horizontales Scrollen ausschließlich in explizit vorgesehenen Chip- oder Kategoriezeilen. Alle Sticky-Elemente berücksichtigen Safe-Area-Inset, insbesondere iOS.

Die **Desktop-Ansicht nicht auf ein künstliches Smartphonefenster begrenzen**; vorhanden ist bereits ein Desktop-Shell-Layout.

## 4. Wiederverwendbare UI-Bausteine

Kleine, klar abgegrenzte Komponenten erstellen. Empfohlene Struktur (nur neue Dateien anlegen, wenn bestehende Bausteine keine geeignete Grundlage sind):

\`\`\`text
src/components/
  wardrobe/
    ProductCard.tsx           Foto, Name, Größe, Zustand, Status, Plus/Check
    CategoryChips.tsx         horizontal, URL-basierte Kategorieauswahl
    WardrobeFilters.tsx       Mobile Bottom Sheet / Desktop Filterbereich
    ProductGrid.tsx           responsive Grid und Empty State
  packages/
    PackageBasketProvider.tsx Auswahlzustand pro aktivem Haushalt
    BasketActionBar.tsx       "X ausgewählt · Paket erstellen"
    BasketReview.tsx          Auswahl prüfen, Titel, Entfernen, Paket anlegen
  dashboard/
    SizeShortcuts.tsx         Größen 56/62/68/74/80…
    RecentItems.tsx           kürzlich erfasste Kleidung
    PendingTransfers.tsx      offene Eingangspakete
  ui/
    ...                       vorhandene Button, Card, Input, Modal, Toast weiterverwenden
\`\`\`

### ProductCard

- Gesamte Karte öffnet \`/wardrobe/[id]\`; die Plus-Aktion **darf nicht** versehentlich die Detailnavigation auslösen.
- Besser: Karte als \`<article>\`, separates \`<Link>\` für Bild/Titel und separater \`<button type="button">\` für Paketwahl; **keinen Button in einem Link verschachteln**.
- Bild dominiert den oberen Bereich. Titel auf max. 2 Zeilen, darunter \`Größe 62 · Sehr gut\`.
- Status: \`Bei uns\`, \`Verliehen\`, \`Ausgeliehen\`, \`Übergabe offen\` oder \`Archiviert\`.
- Plus erscheint nur, wenn das Teil in diesem Haushalt **für ein Paket verfügbar** ist. Bei ausgewählt wechselt es zu Check/Minus; \`aria-pressed\` und \`aria-label\` setzen.
- Fallback bei fehlendem Foto: ruhiger Platzhalter mit Kleidungs-Icon, nicht leerer Bildrahmen.
- Hover nur als Desktop-Zusatz; alle Aktionen müssen ohne Hover sichtbar sein.

### CategoryChips

- Scrollzeile: \`Alle · Bodys · Strampler · Hosen · Oberteile · Pullover · Jacken · …\`.
- Aktiver Chip ist textlich und visuell erkennbar; beim Ändern andere Filter **beibehalten**.
- Serverseitige URL-Parameter: \`q\`, \`category\`, \`size\`, \`condition\`, \`status\`, \`sort\`.
- **Filter sind URL-State**: Browser-Zurück, Teilen, Reload und Desktop funktionieren.
- Beispiel: \`/wardrobe?category=body&size=62&status=at_home\`. Kategoriewerte über ein zentrales Mapping auf gespeicherte \`items.title\`-Werte abbilden (keine wilde Substring-Zuordnung). Langfristig \`categories.slug\` + FK verwenden.

### WardrobeFilters

- Smartphone: Filter-Button öffnet ein Bottom Sheet mit \`Größe\`, \`Zustand\`, \`Standort/Status\`, \`Sortierung\`; Buttons \`Zurücksetzen\` und \`X Ergebnisse anzeigen\`.
- Desktop: gleicher Filter-State als kompakte Sidebar oder Popover.
- Geöffnete Dialoge blockieren Hintergrundscrollen, bekommen Fokus beim Öffnen und geben Fokus beim Schließen zurück; Escape und sichtbarer Schließen-Button.
- Kein Reload bei jedem Tastendruck nötig; bei Suche optional Debounce, bei Filteränderungen unmittelbar anwenden.
- Zähler zeigt **Ergebniszahl nach allen aktiven Filtern**, nicht Gesamtbestand.
- Leere Treffer liefern einen eigenen Reset-CTA.

## 5. Paketkorb: zentrale neue Interaktion

Der Paketkorb ist **eine Auswahlhilfe**, kein zweites Besitz- oder Paketdatenmodell.

### 5.1 Nutzung

1. Im Kleiderschrank einen oder mehrere **verfügbare** Artikel per Plus auswählen.
2. Plus wird zu Check. Sichtbare, nicht überlappende Leiste oberhalb der Bottom-Navigation: \`5 Teile ausgewählt · Paket erstellen\`.
3. Auf Leiste tippen → Paket-Review: Fotominiaturen, Teilanzahl, Titel und Notiz.
4. \`Paket erstellen\` nutzt **bestehendes** \`createPackage\`; danach ausgewählte Teile mit \`addPackageItem\` übernehmen (vorzugsweise **atomare Serveraktion** statt clientseitiger Einzelrequests).
5. Nutzer landet auf \`/packages/[id]\` mit vorausgewählten Artikeln, wählt Empfänger und \`Verschenken\`/\`Verleihen\`, dann \`Senden\`.
6. **Erst nach Annahme** des Empfängers wird der Bestand geändert (bestehende Transfer-Semantik beibehalten).

### 5.2 State und Persistenz

**MVP-Empfehlung:** Zustand im \`PackageBasketProvider\` als \`Set<string>\` pro \`householdId\`, Spiegelung in \`sessionStorage\` (nur Artikel-UUIDs, kein Name, kein Secret, keine Fotos). Dies ermöglicht Navigation/Reload im gleichen Tab, erzeugt aber noch kein Paket auf dem Server.

- Key z. B. \`kp:basket:v1:<household-id>\`.
- Wechsel des aktiven Haushalts räumt die aktive Auswahl; andere Haushalts-IDs werden niemals in der neuen Auswahl verwendet.
- Nach erfolgreich erzeugtem Paket Auswahl löschen.
- Nicht mehr verfügbare/archivierte/zwischenzeitlich übergebene Artikel auf dem Server herausfiltern und Nutzer verständlich informieren.
- \`sessionStorage\` ist **keine Autorisierung**. Eingesendete IDs niemals ungeprüft akzeptieren.
- Nicht in eine normale Client-Komponente auslagern, die eigene \`db\`-Zugriffe macht; Mutationen ausschließlich über Server Actions/API.
- Um Refresh und Multi-Tab dauerhaft synchron zu halten, wäre später ein serverseitiger Paketentwurf möglich; für Phase 1 unnötig.

### 5.3 Paket-Erstellung auf dem Server

Neue Serveraktion (Name z. B. \`createPackageFromSelection\`) mit Parametern \`title\`, \`notes\`, \`itemIds: string[]\`:

1. Auth.js-Session + \`getContext()\` verwenden.
2. Maximal sinnvolle Anzahl (z. B. 100 IDs), UUID-Format, Duplikate und Haushaltszugehörigkeit validieren.
3. In **einer PostgreSQL-Transaktion**: ausgewählte Artikel \`FOR UPDATE\` sperren, Eigentum und aktuellen Aufbewahrer validieren, offene Transfers ausschließen.
4. Paket als \`draft\` erstellen, alle \`package_items\` einfügen; entweder alle erfolgreich oder keine.
5. Paket-ID zurückgeben/auf \`/packages/[id]\` weiterleiten.
6. Vorhandene Aktionen \`sendPackage\` und \`decideTransfer\` unverändert verwenden; nur ggf. gemeinsame Validierungshelper extrahieren.
7. Fehlgeschlagene Erstellung belässt den Client-Paketkorb und zeigt eine konkrete Fehlermeldung.

**Keine stille Übergabe durch Aufnahme in den Paketkorb.** Eine Selektion bedeutet weder Reservierung noch Eigentumswechsel.

### 5.4 UX-Details

- Basket-Leiste nur zeigen, wenn die Auswahl nicht leer ist.
- Abstand zur Bottom-Navigation per \`env(safe-area-inset-bottom)\` berücksichtigen.
- Kein Layout-Sprung beim Ein-/Ausblenden; \`position: fixed\` mit berechnetem Abstand.
- Wenn ein Artikel gerade nicht auswählbar ist: deaktivierte Aktion + kurze Begründung.
- Aus dem Paketkorb entfernen, Auswahl komplett leeren und \`Weiter auswählen\` anbieten.
- Browser-Zurück soll den Auswahlzustand erhalten.

## 6. Screens und Seiten im Detail

### 6.1 Dashboard – \`src/app/page.tsx\`

**Reihenfolge auf Mobilgeräten:**

1. App-Header (Logo, Benachrichtigungen) und aktiver Haushalt.
2. Überschrift \`Hallo, …\`; eine Zeile Erklärung.
3. Prominente Suche (führt nach \`/wardrobe?q=...\`).
4. Zwei große Schnellaktionen: \`Kleiderschrank\`, \`Pakete packen\` (plus ein gut sichtbarer Erfassen-Button in der Nav).
5. **Nach Größe stöbern** – horizontale Quicklinks z. B. 50/56/62/68/74/80/86/92; nur sinnvolle Größen priorisieren.
6. **Zuletzt erfasst** – horizontaler oder 2-spaltiger Produktkarten-Ausschnitt, max. ca. 4–6 Elemente; aus Datenbank **für aktiven Haushalt** filtern.
7. **Offene Übergaben** – echte Zahl, klarer Link nach \`/transfers\`.
8. Bestandskennzahlen weiter unten oder reduziert; sie dürfen die produktbezogenen Aktionen nicht verdrängen.

**Kein Dummy-Content als echte Kleidung anzeigen**. Bei leerem Bestand: überzeugender Empty State \`Erstes Kleidungsstück fotografieren\`.

### 6.2 Kleiderschrank – \`src/app/wardrobe/page.tsx\`

**Reihenfolge:**

- Titel \`Meine Kleidung\`, Button \`+ Hinzufügen\`.
- Suche.
- Scrollbare Kategorien (separates \`category\`-Feld!).
- Filteraktion und aktive Filterzusammenfassung, Ergebnismenge.
- 2-spaltige Produktkarten auf Mobilgeräten.
- Paketkorb als eigenständige Leiste, falls Auswahl > 0.

**Technischer Fix zwingend vor Visual Polish:** \`onClick/window.location\` aus Server Component entfernen. URL-basierte Filter, korrekte Query-Parameter und DB-Abfrage synchronisieren. Beim Aufbau des Katalogs dürfen \`condition\`-Werte nie als Kategorie missbraucht werden.

### 6.3 Produktdetail – \`src/app/wardrobe/[id]/page.tsx\`

- Großes Hauptfoto, weitere Fotos als Swipe-Galerie oder Thumbnails.
- Name, Größe, Zustand und Besitzerstatus direkt sichtbar.
- Eine primäre Aktion: \`Zum Paket hinzufügen\` (nur bei verfügbarer Kleidung).
- Sekundär: \`Bearbeiten\`, \`Weiteres Foto\`, \`Archivieren\` im Overflow/unter Details.
- Details übersichtlich: Herkunft, Marke, Farbe, Notizen; ohne Daten kein leerer Block.
- **Lebenslauf** als vertikale Zeitleiste mit Zeitpunkten und direkt beteiligten Haushalten. Fremde spätere Empfänger bleiben anonymisiert, wie bisher.
- Zurück-Button; History/back funktioniert auch nach vorherigem Filtern.

### 6.4 Fotoerfassung – \`src/app/wardrobe/new/NewItemForm.tsx\`

- **Kamera zuerst** auf Mobilgeräten, Galerie als Alternative.
- Nach Fotoaufnahme sofort eine große Vorschau, \`Erneut aufnehmen\`, \`Entfernen\`.
- Pflichtfelder im sichtbaren Bereich: \`Kleidungsart\`, \`Größe\`, \`Herkunft\`; im aktuellen Backend zusätzlich \`condition\` mit gültigem Standardwert \`good\`.
- \`Weitere Angaben\` für Marke, Farbe, Notizen einklappbar.
- Einspaltig; großer \`Speichern\`-Button unten, bei Submit deaktiviert und mit Fortschrittszustand.
- Validierung inline, keine reinen Alert-Popups.
- Vorhandene Foto-Kompression, private Auslieferung und Backendrechte bewahren.
- Bestehende Pläne zur Mehrfacherfassung/Entwurf-Wiederaufnahme aus \`tasks/plan.md\` nicht überschreiben. Bei einem bestehenden Wizard dessen State-Machine respektieren.

### 6.5 Pakete – \`src/app/packages/page.tsx\`, \`new/page.tsx\`, \`[id]/page.tsx\`

- Paketübersicht: \`Entwürfe\`, \`Warten auf Bestätigung\`, \`Abgeschlossen\` mit Foto-Vorschaubildern/Anzahl.
- Bestehende Pakete als Karten, nicht textschwere Tabellen.
- Beim Einstieg über Paketkorb: \`X ausgewählte Teile\` bereits eingetragen, kein doppeltes Abtippen.
- Paketdetail: Teile als Mini-Karten mit Entfernen in \`draft\`, Empfänger-Auswahl, Typ Schenken/Leihen und optional Rückgabedatum.
- Status nach Absenden sichtbar \`Wartet auf Annahme\`; Änderungen am Inhalt dann deaktiviert.
- Benutzer muss verstehen, dass \`Senden\` **noch nicht den Besitz überträgt**.

### 6.6 Übergaben – \`src/app/transfers/page.tsx\`

- Segment \`Eingehend\` / \`Ausgehend\` / \`Leihgaben\` (als URL-State oder zugängliche Tabs).
- Jede Karte: Paketname, Absender/Empfänger, Miniaturen, Teilanzahl, Status, Datum.
- Eingehende offene Übergabe: großer \`Annehmen\`-Button und klarer \`Ablehnen\`-Button.
- Leihgaben: Hinweis, wer Eigentümer ist und wo die Kleidung aktuell liegt; Rückgabeaktion.
- Doppeltes Absenden verhindern; Zustandswechsel atomar im Backend und kein optimistisches Eigentums-Update vor Bestätigung.

### 6.7 Familie & Benachrichtigungen

- Bestehende Funktionalität aus \`src/app/family/page.tsx\` und \`src/app/notifications/page.tsx\` **nicht neu erfinden**.
- Einladungslinks kopierbar, klarer Button \`Familie einladen\`; aktive Haushaltswahl immer erkennbar.
- Benachrichtigungen mit Zeit, Status und Ziel-Link, insbesondere \`Paket wartet auf dich\`.
- Fachliche Inhalte/Autorisierung aus dem bestehenden Code nicht verändern, solange das Refactoring nur das Design betrifft.

## 7. Navigation: Mobile und Desktop

### Mobile Tab-Bar (Vorschlag mit 5 Aktionen)

\`\`\`text
[Übersicht] [Kleidung] [  +  ] [Pakete] [Familie]
\`\`\`

- **Zentrales Plus**: gezielte Hauptaktion, Link zu \`/wardrobe/new\`.
- Benachrichtigungen bleiben als Glocke im Header, statt eine der vier Hauptansichten zu verdrängen.
- Icon **plus** Textlabel bei den regulären Tabs; für mittige Aktion zugänglicher Name \`Kleidungsstück erfassen\`.
- Aktiver Bereich mit Hintergrund, Text/Unterstreichung kenntlich machen.
- Desktop: vorhandene Sidebar um \`Kleidungsstück erfassen\` als klaren CTA ergänzen, Glocke im Header belassen.
- Keine zwei gleichzeitig sichtbaren Navigationen auf Tablet; Breakpoint eindeutig festlegen.

### Route-/State-Konvention

| Route | Ziel |
|---|---|
| \`/\` | Personalisierter Überblick |
| \`/wardrobe\` | Katalogansicht |
| \`/wardrobe?category=body&size=62\` | Teilbarer Filterzustand |
| \`/wardrobe/new\` | Erfassung |
| \`/wardrobe/[id]\` | Detail und Lebenslauf |
| \`/packages\` | Pakete und Entwürfe |
| \`/packages/new\` | Paket erstellen, optional mit Vorauswahl |
| \`/packages/[id]\` | Packen/Versenden |
| \`/transfers\` | Übergaben |
| \`/family\` | Haushalte/Kontakte |

## 8. Umsetzung in Reihenfolge (Agenten-Arbeitspakete)

**Wichtig:** Nicht alles in einem unkontrollierten Commit umstellen. Pro Phase Funktionen, TypeScript, Build und mobile Ansichten überprüfen; danach erst weiter.

### Phase 0 – Code- und Regression-Audit

- [ ] \`main\` aktualisieren und Branch z. B. \`feature/knuspr-inspired-ux\` anlegen.
- [ ] Vorhandenes UI in \`AppShell\`, \`globals.css\`, \`src/components/ui\` und den bereits bearbeiteten Screens inventarisieren.
- [ ] Prüfen, ob \`tasks/mobile-optimization.md\` oder \`tasks/plan.md\` inzwischen umgesetzt wurden.
- [ ] Bestehende Authentik-Anmeldung, Haushalt-Zuordnung, Fotos und Paket-/Transfer-Server-Actions unverändert funktional halten.
- [ ] \`npm ci\`, \`npm run typecheck\` und \`npm run build\` als Ausgangslage.

**Abnahme:** Baseline dokumentiert; keine unnötigen neuen Dependencies.

### Phase 1 – Katalog/Filter korrekt und schnell

- [ ] \`category\` und \`condition\` konsequent trennen.
- [ ] Filterchips als Links oder Client-Komponente mit korrekten URLs.
- [ ] Zentralen Kategorie-Mapping-Helper verwenden; aktuelle \`items.title\`-Werte berücksichtigen.
- [ ] Größen-/Zustands-/Statusfilter und Sortierung kombinierbar.
- [ ] Produktkarte als unabhängige UI-Komponente extrahieren; Foto, Label und Plus-Aktion.
- [ ] Responsives Grid für 320/390/768/1024 px prüfen.

**Abnahme:** Klick auf \`Bodys\` zeigt nur Bodys; \`Gut\` filtert unabhängig davon; Reload, Back und Links funktionieren; keine Server-Component-Event-Handler.

### Phase 2 – Paketkorb mit Schnellaktionen

- [ ] \`PackageBasketProvider\` und pro-Haushalt-Auswahl implementieren.
- [ ] Plus/Check auf Katalogkarte und Detailseite.
- [ ] Sticky \`BasketActionBar\` oberhalb Tab-Bar.
- [ ] Paket-Review mit Entfernen, Leeren und Titel/Notiz.
- [ ] \`createPackageFromSelection\` serverseitig in **einer** Transaktion; Berechtigungsprüfung.
- [ ] Erfolgs-/Fehler-Rückmeldung; Auswahl nur nach Erfolg löschen.
- [ ] Bestehende \`sendPackage\`- und \`decideTransfer\`-Flows weiterverwenden.

**Abnahme:** 5 Teile in weniger als 15 Bildschirmberührungen zu einem Paket gruppierbar; kein unberechtigtes oder ausgeliehenes Teil lässt sich übertragen.

### Phase 3 – Startseite und Navigation

- [ ] Dashboard nach Abschnitt 6.1 umordnen.
- [ ] Größe-Chips und \`Zuletzt erfasst\` aus echten Haushaltsdaten.
- [ ] Offene Übergaben mit korrekten Zählern.
- [ ] Fünfteilige mobile Navigation mit mittigem Erfassungs-CTA.
- [ ] Desktop Sidebar, Notifikationsglocke, Safe Areas beibehalten.

**Abnahme:** Erfassung ist von jeder Hauptansicht mit einem Tipp erreichbar. Startseite liefert aus dem Stand einen brauchbaren Einstieg.

### Phase 4 – Details, Pakete, Transfers und weitere Seiten

- [ ] Fotohero, lesbare Details und Timeline.
- [ ] Pakete mit Fotos und präzisen Status.
- [ ] Eingang/Ausgang/Leihgaben klar trennen.
- [ ] Family/Notifications visuell harmonisieren.
- [ ] Vorhandene Aufnahmefunktion und Link-Einladung gegen Regression testen.

**Abnahme:** Vollständiger Ablauf \`Erfassen → Auswählen → Paket → Senden → Annehmen → Verlauf\` mit zwei Konten.

### Phase 5 – QA, Dokumentation und Release

- [ ] Alle visuellen Zustände testen: leer, 1 Element, 100 Elemente, ohne Fotos, viele Fotos, sehr lange Namen.
- [ ] Screenshots bei 320 × 700, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900 prüfen.
- [ ] Chrome Android, Safari iOS, Desktop-Browser; Touch- und Tastaturbedienung.
- [ ] Kontrast, Tab-Reihenfolge, Fokus, Screenreader-Labels, Escape/Dialoge.
- [ ] \`npm run typecheck\`, \`npm run build\`, GitHub Actions + DB-Tests.
- [ ] README/Changelog/Sitemap aktualisieren; Screenshots dem PR beifügen.
- [ ] PR mit vorher/nachher-Bildern erstellen und nach Tests mergen.

**Abnahme:** Keine Layoutüberläufe, keine regressiven Berechtigungslücken, alle Kernabläufe bedienbar.

## 9. Nichtfunktionale Anforderungen

- **Performance:** möglichst wenig clientseitiges JavaScript; Filterlisten per Server Components rendern und nur Auswahl/Bottom Sheet/Interaktionen als Client Components ausführen. Bei großen Katalogen paginieren bzw. datenbankseitig begrenzen.
- **Fotos:** nur \`/api/photos/[id]\` verwenden; Authentik-Sessions und Haushalt-Rechte für jedes private Bild respektieren. Keine privat geschützten Bild-URLs an öffentliche CDNs geben.
- **Zustandsverwaltung:** URL-Filter sind serverseitig; Paketkorb ist clientseitig, Server ist Quelle der Wahrheit für Verfügbarkeit.
- **Berechtigung:** Plus-Button verbergen reicht nicht; Server prüft \`ownerHouseholdId\`, \`holderHouseholdId\` und offene Übergaben erneut.
- **Keine neue Infrastruktur:** Bestehender Authentik und NPM bleiben; lokale \`.env\` und Docker-Volumes dürfen weder von UI-Arbeiten überschrieben noch committed werden.
- **Migrationen:** Fachliches Kategorien-Backfill nur mit versionierter Drizzle-Migration und Testdaten; keine manuelle \`db:push\`-Änderung auf produktiven Beständen ohne Backup.
- **Sichtbarkeit:** Bei Bestand \`Verliehen\` / \`Ausgeliehen\` / \`Weitergegeben\` sauber differenzieren. Einem ehemaligen Besitzer keine unerlaubten persönlichen Daten späterer Empfänger anzeigen.

## 10. Definition of Done

Die Design-Umsetzung ist erst abgeschlossen, wenn:

- [ ] Der Kleiderschrank ein konsistentes, fotozentriertes Raster auf Handy, Tablet und Desktop besitzt.
- [ ] Suche, Kategorie, Größe, Zustand und Status **separat** korrekt funktionieren.
- [ ] Filter beim Reload/Zurück erhalten bleiben.
- [ ] Paketkorb-Auswahl über Navigation/Reload funktioniert, je Haushalt getrennt ist und serverseitig validiert wird.
- [ ] Paket in einem Schritt aus mehreren ausgewählten Teilen erstellt werden kann.
- [ ] Kein Besitzwechsel ohne bestätigte Übergabe stattfindet.
- [ ] Dashboard und Detailseite echte Daten und verständliche Leerstates darstellen.
- [ ] Mobile Navigation in allen Ansichten leicht erreichbar ist.
- [ ] Authentik, NPM, Fotozugriff, Historie, Einladung und Transfers unverändert korrekt funktionieren.
- [ ] CI grün ist und die kritischen End-to-End-Tests mit zwei echten Testkonten durchgeführt wurden.

## 11. Kompakter Arbeitsauftrag für OpenCode

Den folgenden Text als Ausgangsprompt verwenden:

> Implementiere die vollständig in \`docs/DESIGN_IMPLEMENTATION_KNUSPR.md\` dokumentierte UI/UX-Überarbeitung für KleiderPfad. Arbeite **in Phasen 0–5** und nutze die vorhandene Next.js/React/TypeScript-Struktur, Design Tokens und UI-Komponenten. Beginne mit einem Ist-Stand-Audit. Korrigiere zwingend den Kategorie-/Zustandsfilter-Bug in \`src/app/wardrobe/page.tsx\` und entferne die Browser-\`window\`-Event-Handler aus Server Components. Implementiere einen mobil nutzbaren, pro Haushalt getrennten Paketkorb mit Plus-Aktionen auf Produktkarten und einer sicheren atomaren Paket-Erstellungsaktion. Baue Dashboard, Produktdetails, Pakete, Übergaben und die mobile Navigation wie im Dokument beschrieben um. **Keine Attrappen, keine Änderung an Authentik/NPM, kein Commit von \`.env\`, keine Regression der Besitz-/Verleih-/Transferlogik.** Nach jeder Phase Typecheck, Build und vorhandene Tests; zum Schluss einen PR mit Screenshots und Testbericht erstellen.

## 12. Quellen/Referenzen

- Design-/Interaktionsreferenz: https://www.knuspr.de/
- Next.js – Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js – Linking and Navigating: https://nextjs.org/docs/app/getting-started/linking-and-navigating
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Interner Bestand: \`tasks/mobile-optimization.md\`, \`tasks/plan.md\`, \`docs/ARCHITECTURE.md\`, \`docs/DATA_MODEL.md\`, \`docs/TESTPLAN.md\`
