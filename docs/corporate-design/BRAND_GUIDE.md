# Kleidolino – Verbindliches Markenhandbuch

## 1. Markenidentität

**Name:** Kleidolino  
**Primärclaim:** Kleine Kleidung. Große Geschichten.  
**Sekundärclaim:** Weitergeben mit Herz.  
**Markenkern:** Kinderkleidung behält ihren Wert, wenn sie weitergetragen wird. Kleidolino macht den Bestand, die Übergabe und die Geschichte der Teile für Familien und Freundeskreise einfach nachvollziehbar.

**Mission:** Familien ermöglichen, Baby- und Kinderkleidung unkompliziert zu organisieren, zu verleihen und weiterzugeben.  
**Vision:** Kinderkleidung soll viele kleine Geschichten erleben – statt ungenutzt zu bleiben.  
**Markenattribute:** familiär · nachhaltig · persönlich · übersichtlich · wertschätzend · unkompliziert.

### Zielgruppen

- Eltern und Angehörige, die Kleidung für mehrere Größen verwalten.
- Familien und Freundeskreise, die Kleidung untereinander weitergeben.
- Menschen, die die Herkunft und Besitzerhistorie eines Kleidungsstücks nachvollziehen möchten.

### Positionierung

Kleidolino ist **keine Verkaufsplattform** und soll nicht wie ein klassischer Onlineshop mit Preisen wirken. Wiederverwendung und Weitergabe stehen im Vordergrund. Der moderne Shopping-App-Stil dient ausschließlich der schnelleren Orientierung.

## 2. Logo

### Gestaltung

- **Symbol:** Hänger/Babybody in einer weichen Kontur, Herz im Kleidungsstück und eine geschwungene Apricot-Linie als Weitergabe-Kreislauf.
- **Wortmarke:** freundlich, rund, modern, gut lesbar.
- **Primärversion:** `assets/logos/primary-horizontal.svg`.
- **Alternativen:** `stacked.svg` für quadratische Flächen, `symbol.svg` für kleine Anwendungen und `app-icon.svg` für PWA/App-Icons.
- **Monochrom:** `monochrome-dark.svg` und `monochrome-light.svg`, wenn Farbe nicht möglich ist.

### Schutzraum und Größen

- Rund um das Logo mindestens die **halbe Symbolhöhe** freihalten.
- Primärlogo nicht kleiner als **160 px Breite digital** oder **35 mm Breite gedruckt** verwenden; in kleinen Flächen das Symbol statt der Wortmarke nutzen.
- App-Icon mindestens 48 × 48 px, für PWA 192 × 192 und 512 × 512 px bevorzugen.
- SVG-Text kann sich durch Font-Fallbacks leicht anders darstellen. **Für finale Druckdaten die Wortmarke in Pfade konvertieren** und freigegebene Version dokumentieren.
- Logo nie stauchen, drehen, mit zusätzlichen Outlines versehen oder auf unruhige Fotos ohne ruhige Unterlage setzen.
- Apricot-Begleitschleife nicht unabhängig von der Hauptmarke als vollständiges Logo missverstehen.

## 3. Farbpalette

| Token | Hex | Funktion |
|---|---|---|
| Waldgrün / `forest` | `#245440` | Primärgrün des umgesetzten Asset-Sets, Button- und Icon-Farbe |
| Tiefgrün / `dark` | `#173D2E` | Lesbarer Haupttext und Logo-Wortmarke |
| Mintgrün / `mint` | `#A8D5BA` | Friendly Highlights, Headerillustrationen |
| Salbeigrün / `sage` | `#C6D8C2` | Sekundärflächen und Chips |
| Creme / `cream` | `#FFF7EC` | Markenhintergrund |
| Apricot / `apricot` | `#F4B08A` | Herz und emotionales Detail |
| Beige / `beige` | `#E8D9C8` | Dekorative Flächen und Print |
| Papierweiß / `paper` | `#FFFCF7` | UI-Karten |
| Sekundärtext / `gray` | `#63756B` | Labels und Hilfstexte |

**Hinweis:** Die frühere Konzepttafel zeigte ein alternatives Waldgrün `#2E5D48`. Für die hier enthaltenen **fertigen Vektorassets ist `#245440` der führende Ton**. Nicht beide willkürlich austauschen; bei einer finalen Farbfreigabe sämtliche Assets und Tokens gemeinsam umstellen.

**Verteilung in der UI:** 70 % helle Flächen, 20 % natürliche Grünnuancen, höchstens 10 % warme Akzente. Apricot dient Hervorhebungen/Illustrationen und ist **keine** Ersatzfarbe für kritische Statusmeldungen.

### Kontrast

- Fließtext auf Creme/Papierweiß in `dark` oder `forest`, nicht in Mint/Apricot.
- Buttons mit Waldgrün + weißem Text und sichtbarem Fokus-Indikator.
- Prüfen nach WCAG 2.2: AA für Text und Bedienelemente; besonders Sekundärtext auf hellem Mint.

## 4. Schrift

| Rolle | Schrift | Ausprägung |
|---|---|---|
| Display / große Headlines | **Nunito** | Bold/ExtraBold (700/800), großzügige Zeilenhöhe |
| Kleine Headlines / Buttons | **Nunito** | SemiBold/Bold (600/700) |
| Fließtext / Formulare / Navigation | **Inter** | Regular/Medium (400/500) |
| Fallback | system-ui, sans-serif | wenn Schrift nicht geladen |

- Default Fließtext: 16 px; Zeilenhöhe ca. 1.5.
- H1 mobil: 28–32 px; Desktop: 36–48 px abhängig vom Layout.
- H2: 22–26 px; Labels: 12–14 px; CTA: 16–18 px.
- Keine langen Textblöcke in Versalien; freundlich und schnell scannbar.

## 5. Formen und UI

- **Karten:** 16–20 px Radius, leichter Rand/Schattierung, ruhige Abstände.
- **Buttons:** 12–16 px Radius, Höhe mind. 48 px, sichtbare Zustände.
- **Chips:** pill/rund, Größe/Kategorie/Status; aktiver Chip nicht nur per Farbe, sondern per Zustand/Typografie.
- **Produktkarten:** quadratisches 1:1-Foto, Name, Größe, Zustand, Status; Plus-Aktion zum Paketkorb separat anklickbar.
- **Mobile Navigation:** Übersicht · Kleidung · **+ Erfassen** · Pakete · Familie.
- **Desktop:** Sidebar plus Header mit Benachrichtigungen, Content-Bereich nicht künstlich smartphone-schmal.
- **Symbole:** reduzierte Linien, möglichst konsistente Kontur (ca. 1.8–2 px bei 24 × 24), weiche Endkappen.

## 6. Bildwelt

- Hell, natürlich, textile Oberflächen und freundliche Lichtstimmung.
- Kleidung möglichst einzeln, vollständig und neutral fotografiert; Vorder-/Rückansicht bei Bedarf.
- Lifestyle-Bilder warm und authentisch, ohne übermäßige Filter.
- Baby-/Kindergesichter auf Uploads im späteren KI-Workflow unkenntlich machen, wie im Projekt vorgesehen.
- In der Asset-Bibliothek befinden sich bewusst originale Vektorillustrationen statt fremder Stockbilder.
- Ausführlich in [IMAGE_GUIDELINES.md](IMAGE_GUIDELINES.md).

## 7. Tonalität

**Warm:** „Schön, dass du da bist!“  
**Hilfsbereit:** „Wähle die Kleidungsstücke aus, die du weitergeben möchtest.“  
**Persönlich:** „Dein Paket ist bei der nächsten Familie angekommen.“  
**Klar:** „5 Teile ausgewählt · Paket erstellen“

### Copy-Bausteine

- „Kleine Kleidung. Große Geschichten.“
- „Weitergeben mit Herz.“
- „Ein Kleidungsstück, viele kleine Abenteuer.“
- „Schön, dass du Kleidung weitergibst.“
- „Jedes Teil erzählt eine Geschichte.“
- „Dein Kleiderschrank im Überblick.“

**Vermeiden:** „Jetzt kaufen“, „Deal“, „Schnäppchen“, „Kundenkonto“ (sofern nicht zutreffend), unnötige Nachhaltigkeitsversprechen ohne Nachweis, übertriebene Anglizismen.

## 8. Markenanwendungen

| Kontext | Asset |
|---|---|
| Header, Impressum, Website-Footer | `assets/logos/primary-horizontal.svg` |
| PWA und App Shortcut | `assets/logos/app-icon.svg` |
| Open Graph / Social Preview | `assets/social/share-og-1200x630.svg` |
| Instagram Post / Story | `assets/social/instagram-post.svg`, `instagram-story.svg` |
| Hero-Banner | `assets/mockups/desktop-hero.svg` |
| Kleider-Etikett | `assets/print/clothing-tag-60x100mm.svg` |
| Paket-Dankeskarte | `assets/print/thank-you-card-a6.svg` |
| Sticker | `assets/print/sticker-round-60mm.svg` |
| Unfrankiertes Etikett | `assets/print/shipping-label-100x150mm.svg` |

## 9. Druckfreigabe

SVG-Dateien sind RGB-Master. In der Druckvorstufe auf das gewünschte ICC/CMYK-Profil überführen, Sonderfarben und Farbabstufungen kontrollieren, Schrift in Pfade umwandeln, 3 mm Beschnitt ergänzen (falls Druckerei verlangt) und für Sticker/Etiketten Stanzkontur nach Vorgabe anlegen. Im finalen Versandlabel müssen Nutzeradresse und Druckdaten serverseitig eingefügt werden; das beigefügte Asset ist nur ein Platzhalter.

## 10. Verbindlichkeit

Als **technische Single Source of Truth** gelten `DESIGN_TOKENS.json` und `tokens.css`. Für neue App-Komponenten dieselben Werte verwenden. Vor Änderungen an Logo, Palette, Schrift und Claim das Brand Kit konsistent aktualisieren.
