# KleiderPfad – Implementierungsauftrag: lokale KI-Bilderkennung, Datenschutz-Pipeline und kontinuierliches Training

> **Status:** Verbindliches Implementierungskonzept, noch keine produktive Implementierung.  
> **Adressat:** Coding-/AI-Agent im Repository `Motrish/KleiderPfad`.  
> **Priorität:** Datenschutz vor Speicherung, Klassifikation und Training.  
> **Zielplattform:** Proxmox LXC, Docker Compose, **8 GB RAM gesamt**, **keine GPU**, ausschließlich lokale Inferenz/Trainingsdaten.  
> **Trainingsregel:** **Täglich prüfen um 03:30 Uhr (Europe/Berlin)**; **ab 100 neuen, bestätigten, zulässigen Beispielen** seit dem letzten erfolgreichen Trainingslauf trainieren, sofern Mindestqualität und Ressourcen vorhanden sind.

## 1. Ziel und harte Anforderungen

Ein Nutzer fotografiert ein einzelnes Kleidungsstück oder lädt ein Foto hoch. Vor der persistenten Speicherung muss ein lokaler Dienst das eigentliche Kleidungsstück möglichst gut isolieren und eng zuschneiden, fremde Bildinhalte entfernen, **alle erkannten Gesichter irreversibel unkenntlich machen** und EXIF-/Metadaten entfernen. **Erst danach** darf das Foto in die reguläre Bildablage, in Vorschaubilder, KI-Features oder Trainingsdaten gelangen.

Die App bietet eine automatisch vorgeschlagene Kleidungskategorie an. Ein vom Nutzer bestätigtes oder korrigiertes Label wird als Trainingskandidat erfasst. Geänderte Metadaten aktualisieren den Datensatz. Das Training erfolgt asynchron auf dem eigenen Server; neue Modellversionen werden erst nach Tests aktiviert.

**Nicht verhandelbar:**
- Keine externe KI-API, kein automatischer Upload von Bildern oder Merkmalen in Cloud-Services. Modelldateien beim Deployment mit expliziter Versions- und Lizenzprüfung beschaffen, lokal vorhalten. Zur Laufzeit keinen Modell-Autodownload.
- Unbereinigte Originalbilder **niemals** in die persistente Fotoablage, PostgreSQL, Trainingsordner, Debug-Logs oder Backups schreiben. Rohdaten nur flüchtig während einer laufenden Anfrage verarbeiten. Keine Rohbild-Retry-Queues oder Crash-Dumps.
- Gesichter vor Speicherung und vor jeder Ableitung unkenntlich machen. Eine reine Bounding-Box-Beschneidung ist keine Datenschutzbereinigung: bei getragenen Kleidungsstücken muss zusätzlich die Kleidung vom Körper und Hintergrund getrennt werden.
- Bei unsicherer Gesichts-/Kleidungssegmentierung **fail closed**: nichts speichern oder fürs Training freigeben; verständliche Meldung mit erneutem Foto oder manueller Freistellung. Keine stillschweigende Speicherung des unbearbeiteten Fotos.
- Gesichterkennung ist nie perfekt. Keine Aussage „100 % garantiert alle Gesichter entfernt“. Testen, konservative Masken verwenden und unklare Fälle zur Nutzerprüfung geben.
- Auch sekundäre Artefakte (Thumbs, Caches, AI-Features, Export, geteilte Pakete) dürfen keine unbereinigten Inhalte enthalten.
- Bestehende Haushalt-/Fotozugriffsregeln müssen erhalten bleiben. Die Verarbeitung darf Artikelübergaben, Authentik, NPM, bestehende Docker-Volumes und die serverseitige `.env` nicht beschädigen.

## 2. Vorhandene Projektstruktur – bei Umsetzung beachten

**Ist-Stand im Repository (Stand Dokumentanlage):**
- Stack: Next.js 16/React/TypeScript, Auth.js mit bestehendem Authentik, PostgreSQL 17 und Drizzle, Docker Compose, vorhandener Nginx Proxy Manager.
- `docker-compose.yml`: Services `app` und `db`; persistente Volumes `app_uploads` (`/data/uploads`) und `postgres_data`; Netzwerk `internal` ist derzeit ein normales Bridge-Netz, **nicht** Docker-`internal: true`.
- `src/lib/photos.ts`: `storePhoto(file)` prüft MIME/10 MB, dekodiert mit Sharp/Pixel-Limit, rotiert, skaliert auf 1400px, speichert JPEG ohne EXIF direkt auf `app_uploads`. **Noch keine Gesichts-Anonymisierung und keine Freistellung.** Dies ist der zentrale zu ersetzende Speicherpfad.
- `src/actions.ts`: `createItem`, `addPhoto`, `updateItem` nutzen die Foto-/Metadatenflüsse. Bei `addPhoto` wird derzeit bereits vor der Prüfung der Artikelberechtigung gespeichert: zuerst Berechtigung prüfen, erst danach verarbeiten/speichern. Fehler-/Rollback-Cleanup gegen verwaiste Dateien vorsehen.
- `src/app/api/photos/[id]/route.ts`: authentifizierter, autorisierter Bildabruf; weiterverwenden. Keine öffentlichen Dateipfade.
- `src/app/wardrobe/new/NewItemForm.tsx`: Kategorien momentan als lokale Strings in `categories` und als `title`-Feld. `src/db/schema.ts` hat bereits `categories` und optionales `items.categoryId`, das `createItem`/`updateItem` noch **nicht** pflegen. **Für ML unbedingt zuerst DB-konsistente Kategorie-IDs/Slugs anbinden**; Titel nicht als alleinigen Trainingslabel-Schlüssel behandeln.
- `src/db/schema.ts` und `docs/DATA_MODEL.md` sind Basis für migrationssichere Erweiterungen.
- Automatisches Deployment: `docs/AUTO_DEPLOY.md` und `scripts/deploy-on-push.sh` berücksichtigen; serverlokale `.env` und persistente Volumes dürfen weder gepusht noch überschrieben werden.

Der Agent muss den tatsächlichen aktuellen Quellstand vor jeder Änderung erneut lesen und Abweichungen zu diesem Ist-Stand berücksichtigen.

## 3. Zielarchitektur (CPU, begrenzter RAM)

~~~text
Browser/PWA
  -> Next.js (Session, Haushaltsrechte, Upload-/Edit-Aktionen)
      -> lokaler API-Aufruf: clothing-ai (nur internes Docker-Netz)
          -> decode/rotate -> face redaction -> garment segmentation
          -> neutrale Maske + enges Crop -> Privacy-/Qualitätsprüfung
          -> bereinigte Bilddaten + optionale Klassifikationsvorschläge
      -> NUR bereinigtes JPEG/WebP in app_uploads
      -> nur erlaubte Item-/Foto-/Trainingsmetadaten in PostgreSQL
  -> Nutzer bestätigt/korrigiert Kategorie
  -> ai_training_samples (bereinigtes Foto referenziert, Labels bestätigt)
  -> täglicher Check 03:30 Europe/Berlin
      -> 100 neue geeignete Beispiele?
      -> nur bei ausreichenden Ressourcen: ai-trainer (One-Shot)
      -> Vergleich/Test -> Modellversion atomar freigeben
~~~

**Zusätzliche Dienste:**
1. **clothing-ai**: Python + FastAPI + OpenCV + ONNX Runtime CPU; übernimmt Datenschutzvorverarbeitung, Gesichtserkennung, Segmentierung und Kleidungsklassifikation. Dauerhaft aktiv, genau ein Worker. Intern, keine Host-Portfreigabe.
2. **ai-trainer**: separater Docker-Compose-Service mit `profiles: [training]`; wird nur bei Bedarf als One-Shot gestartet. Trainingsansatz: vortrainiertes **MobileNetV3-Small als Feature-Extractor**, zunächst nur kleinen Klassifikationskopf (beispielsweise scikit-learn LogisticRegression) lokal mit allen gültigen Beispielen neu trainieren; kein tägliches Finetuning des gesamten Netzes.

**Ressourcenbudget:**
- 8 GB RAM sind das LXC-Gesamtbudget, nicht exklusiv für KI. Beginne mit je 1 Worker / maximal 2 CPU-Threads / seriellen Bildanalysen.
- Der bisherige 512-MB-Wert für `clothing-ai` ist **ein Zielwert, keine Zusage**. Eine echte Fashion-Segmentierung kann deutlich mehr benötigen. Segmentierungsmodell und temporäre Bilder gegen RAM/CPU messen; zunächst z. B. 768 MB bis 1,5 GB für den Dienst testen und anhand Peak-RSS und Lastprofil festlegen. Bei OOM leichtere Modelle/kleinere Eingabeauflösung wählen, nicht Schutzschritte abschalten.
- Trainer isoliert begrenzen; nur starten, wenn Next.js/PostgreSQL und die dauerhafte Bildanalyse sicher weiterlaufen. Optional Auslagerung des Trainings auf einen vertrauenswürdigen lokalen GPU-PC; Daten bleiben im eigenen Netzwerk.
- **Kein Ollama / LLM** für diese eingeschränkte Klassifizierungsaufgabe erforderlich.
- Produktivdienst benutzt nur lokale, versionierte Modelldateien; Volumes/Dateien nicht bei App-Rebuild verlieren.

**Netzwerk:** Neues `ai_private` mit `internal: true` an `app` und `clothing-ai` anschließen; bestehendes Netz `internal` für App/DB/OIDC unverändert lassen. **Nicht** das bestehende Netz unüberlegt auf `internal: true` umstellen, da die App externen Authentik-OIDC-Zugriff benötigt. `clothing-ai` hat keine öffentlich gemappten Ports und zur Laufzeit idealerweise keinen Outbound-Zugang. Datenspeicher/Migrationsrechte nur wie benötigt.

## 4. Verbindliche Datenschutz-Pipeline

Die Schritte müssen zentral für **alle** Foto-Uploadwege gelten, auch `createItem` und `addPhoto`, zukünftige Mehrfachuploads, mobile Kamera, Import und Training.

### 4.1 Eingabe absichern und nur flüchtig verarbeiten
1. Vor dem Lesen/Bearbeiten die Session und das zulässige Haushalt-/Artikelrecht überprüfen (bei neuen Items den aktiven Haushalt).
2. Dateigröße maximal 10 MB wie bisher, echte Dateisignatur/Decodierbarkeit und zulässiges Format prüfen; Sharp/OpenCV-Decoder gegen Dekompressionsbomben begrenzen (derzeit 24 Mio. Pixel). Begrenzte Request-Dauer/Concurrency.
3. Bildorientierung normalisieren; originalen Upload in RAM puffern, nicht in einem persistenten Upload-Verzeichnis. Unvermeidbare temporäre Dateien nur auf flüchtigem tmpfs ohne Logs; danach zuverlässig entfernen.
4. Alle Original-EXIF-, GPS-, Dateinamen-, Kommentar- und ICC-Metadaten aus dem finalen, neu codierten Bild entfernen. Kein Original zur späteren „besseren Verarbeitung“ aufheben.

### 4.2 Gesichtserkennung **vor** dem Cropping
1. Leichtgewichtigen lokalen Face Detector testen, beispielsweise **OpenCV YuNet (FaceDetectorYN)** als ONNX-Modell; keine externen APIs.
2. Auf dem **vollständigen normalisierten Bild** (gegebenenfalls mehreren Skalen) sämtliche erkannten Gesichtsregionen suchen: Hauptperson, weitere Personen, Hintergrundgesichter, Kinder, Gesichter auf Monitoren/Postern soweit erkennbar.
3. Boxen konservativ um Kopf-/Randbereiche vergrößern; die Pixel **irreversibel überschreiben**, am sichersten mit deckender neutraler Fläche. Starker Blur/Pixelisierung ist als UI-Alternative nur erlaubt, wenn durch Tests keine wiedererkennbare Rekonstruktion möglich ist. Standard: deckende Maske.
4. Erkannte Gesichtspixel dürfen auch innerhalb einer späteren Segmentierungsmaske nicht zurückkehren. Gesichtsregionen und sonstige haut-/haarbezogene Segmente generell aus dem Zielbild ausschließen.
5. Nach dem endgültigen Freistellen/Crop erneut prüfen; bei Detektion oder unsicherem Fall ablehnen bzw. manuelle Nachbearbeitung verlangen. Detector-Ausfall = **kein** unbereinigter Fallback.

**Nicht verwechseln:** Keine Detektion bedeutet nicht zuverlässig „kein Gesicht“. Besonders bei getragenen Kleidungsstücken auf konservative Person-/Körpermerkmale reagieren und bei Unklarheit manuelle Prüfung verlangen.

### 4.3 Kleidung segmentieren, Hintergrund entfernen, zuschneiden
1. **Freistellung statt nur Rechteck-Crop**: Eine Pixelmaske bestimmt das sichtbare Kleidungsstück. Nicht-Kleidung (Person, Haut, Haare, Möbel, Umgebung, Schriftstücke, andere Gegenstände) wird mit neutralem Hintergrund ersetzt (z. B. Weiß/Transparent für Verarbeitung, final standardisiertes JPEG).
2. Für **getragenes Kleidungsstück** Fashion-/Human-Parsing mit Klassen wie Upper-clothes, Pants, Dress, Skirt und Shoes prüfen. Nicht-Kleidungslabels wie Face, Hair, Arms, Legs und Background nicht in die finale Maske übernehmen; Übergänge auf Farbsäume prüfen.
3. Für **Flat-Lays/liegende Kleidung** einen separaten Foreground-/Garment-Pfad testen: Fashion-Human-Parser können diese Darstellungen verfehlen. Kandidaten anhand realer Kinderkleidungsfotos evaluieren, nicht einfach COCO-`person`-Segmentation mit Kleidungserkennung verwechseln.
4. Größte passende zusammenhängende Kleidungsregion wählen, Maskenfehler prüfen, enges Bounding-Rectangle plus wenig Rand, quadratisch/für MobileNetV3 auf Zielformat pad/resize (ohne Kleidungsstück zu verzerren). Kein bloßer Center-Crop, der Ärmel/Hosenbeine abschneidet.
5. Bei mehreren Kleidungsstücken im Bild V1: einzelne Auswahl anbieten oder um separates Foto bitten; keine ungeprüften Mischbilder ins Training.
6. Wenn Maske fehlt, viel Hintergrund übrig bleibt, Kleidungsstück angeschnitten ist oder die Fläche zu klein ist: Rückgabe `needs_user_review` bzw. `rejected`. **Keine automatische Originalbild-Übernahme**.
7. Nachbereinigtes Bild als Vorschau zeigen, vor finalem Speichern nutzerseitig akzeptieren lassen. Manueller Ausschnitt ersetzt nicht die automatische Face-Redaction; wenn eine manuelle Maske zulässig ist, Schutzpipeline erneut ausführen.
8. Nur die **endgültig bereinigte** Darstellung als App-Foto und als Quelle für KI-Features/Training verwenden. Bereinigte Fotos können trotzdem noch Informationen enthalten (Aufdruck/Namensschild); wenn so etwas erkannt wird, Bereich maskieren oder erneute Aufnahme verlangen.

**Prüfbare Modellkandidaten, noch keine getroffene Produktionswahl:**
- **OpenCV YuNet** (sehr kleiner Face Detector): https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet
- **SegFormer B2 Clothes** (Fashion-Parsing als Referenzkandidat mit Klassen Face/Hair/Upper-clothes etc.): https://huggingface.co/mattmdjaga/segformer_b2_clothes – **vor Nutzung Modelllizenz, Ressourcen und Eignung für Flat-Lay/Babykleidung prüfen**. Kein Vorabversprechen, dass das B2-Modell unter 512 MB RAM läuft.
- ONNX Runtime CPU/Threading: https://onnxruntime.ai/docs/performance/tune-performance/threading.html

Gegenüber einem großen Segmentierer **leichtere geeignete Modelle mit ONNX/Quantisierung** vorziehen, falls Qualitäts- und Privacy-Tests bestanden werden. Keine Modell-/Lizenzannahmen ohne Dokumentation; Konfiguration und SHA256 der Modelldateien festhalten.

### 4.4 Fehlerbehandlung und Sichtbarkeit
- API-Statusmodell: `processed`, `needs_user_review`, `rejected`, `failed`.
- `processed`: enthält ausschließlich bereinigte Bildbytes, Prozess-/Modellversion und Qualitätsindikatoren; **niemals** Rohdaten zurückschicken.
- `needs_user_review`: bearbeitbarer sicherer Preview oder Hinweis auf neues Foto; Rohbild nicht persistieren.
- `rejected`: keine sichere Freistellung möglich, Upload nicht speichern; nutzerfreundlicher Hinweis (z. B. Kleidung allein vor neutralem Hintergrund fotografieren).
- `failed`: technischer Fehler/Timeout; keine Datei speichern, normale Artikelerfassung ohne Foto weiter erlauben.
- Nutzer sieht nach Verarbeitung **nur** die bereinigte Vorschau; alte lokal erzeugte Blob-URLs nach Wechsel freigeben, unbereinigte Originalvorschauen nicht langfristig im UI halten.
- Keine Bilddaten, Bild-Base64, erkannten Personendetails oder Tokens in Logs, Traces, Ausnahmen, Analytics oder Benachrichtigungen.

## 5. Konkrete API-Verträge

Beispiel für internen Aufruf aus Next.js (nur Docker-Netz, Service-Authentisierung über private Netzgrenze und optional internes Token):

- `POST /v1/process-photo` – Multipart-Bild in RAM annehmen; Privacy-/Segmentierungspipeline; Antwort: bereinigte Datei plus strukturierte Metadaten/Status. Variante mit zwei Schritten (erst Process, dann Classification) ist okay, solange kein unbereinigtes Ergebnis persistiert oder an Client zurückgegeben wird.
- `POST /v1/classify` – ausschließlich **bereinigte** Bildbytes oder intern referenzierte sanitizte Bilder; Ausgabe mit gültigen Kategorie-Slugs/IDs und Top-3-Vorschlägen. Kategorie-IDs aus DB/erlaubten Kategorien auf App-Seite validieren.
- `GET /health` – einfacher Dienststatus, keine sensitiven Inhalte.
- `GET /ready` – Modelle geladen und fehlerfrei, keine sensitiven Inhalte.

Versionierte JSON-Struktur für Metadaten, z. B.:

~~~json
{
  "status": "processed",
  "pipeline_version": "privacy-v1",
  "sanitized": true,
  "face_regions_redacted": 1,
  "garment_mask_ok": true,
  "classification": {
    "category_slug": "jacke",
    "candidates": [
      { "category_slug": "jacke", "score": 0.88 },
      { "category_slug": "pullover", "score": 0.09 }
    ]
  }
}
~~~

Die Scores sind modellabhängige Klassifikationswerte, keine automatisch kalibrierten Wahrheitswahrscheinlichkeiten. Unbekannte/unsichere Zuordnung nicht erzwingen. Das JPEG selbst über binären Response bzw. nach Verarbeitung über sicheren internen Speicher austauschen, nicht als langes JSON-Base64 loggen.

## 6. Integration in Next.js/Drizzle

### 6.1 Foto-Lebenszyklus
1. `src/lib/photos.ts`: Funktion in einen **einzigen Privacy-Gateway-Pfad** umgestalten. `storePhoto` darf finalen Datei-Key **erst** nach erfolgreichem lokalen `/v1/process-photo` und Prüfung von `sanitized=true` vergeben. Ein `sanitized`-Bool aus untrusted Input allein reicht nicht: Aufruf nur intern und finale Dateibytes technisch nachprüfen.
2. Bereinigte Bilder mit zufälligem UUID-Dateinamen und restriktiven Rechten nur auf `app_uploads` speichern. Keine Originale daneben. Bestehendes Format/Foto-API-Verhalten möglichst kompatibel halten.
3. `createItem`/`addPhoto`: Session/Artikelzugriff vor teurem Lesen/Processing sichern; bei DB-Fehlern neu erzeugte Bilddatei entfernen (oder Outbox/GC-Job für Waisen), keine halb registrierten Originale.
4. `src/app/api/photos/[id]/route.ts`: nach wie vor mit Autorisierung, `private, no-store`; liefert nur sanitizte Bilder. Vorhandene Bilder sind **Altdaten**: gesonderte einmalige, lokal laufende Bereinigung/Migration mit Dry-Run und Report statt heimlicher Weiterverwendung alter Fotos.
5. Auch zukünftige Bildvarianten/Thumbnails ausschließlich aus sanitiztem Masterbild erzeugen. Prüfen, ob bestehende Uploads/Backups vor Release alte, unbereinigte Fotos enthalten, und planvoll behandeln.

### 6.2 Kategorien richtig anbinden
- Im Formular `NewItemForm.tsx` die hardcodierten Kategorien auf vorhandene DB-Kategorien (`categories.id`/`slug`) abbilden. `title` ist aktuell die Art-Auswahl; es darf nicht als einzige stabile ML-Kategorie verwendet werden.
- `createItem` und `updateItem` müssen `items.categoryId` serverseitig gegen erlaubte Kategorien prüfen und persistieren. Bei späterer Umbenennung bleiben IDs stabil.
- V1 kann optional `title` zur Anzeige weiter nutzen, aber bei Abweichung von `categoryId` eine definierte Migrations-/Synchronisationsregel haben.

## 7. Automatische Sammlung bestätigter Trainingsdaten

PostgreSQL/Drizzle-Migrationen für:
- `ai_training_samples`: `id`, `item_id`, `photo_id`, `category_id`, `label_source` (user_confirmed/user_corrected), `label_revision`, `verified_at`, `eligible`, `privacy_pipeline_version`, `content_hash`, `feature_version`, `feature_ref`, `consent_state`, `created_at`, `updated_at`, `last_successful_training_run_id` (falls sinnvoll).
- `ai_training_runs`: `id`, Start/Ende, Daten-Snapshot/Revision, neue Beispiele, Kategorieverteilung, Modellversion, Evaluationsmetriken, Status, Fehlermeldung ohne sensible Inhalte.
- `ai_model_versions`: Version, SHA256, Pfad, aktiv/alt, Input-/Feature-/Privacy-Pipeline-Version, Modellmetriken, Aktivierungszeit.
- Optional `ai_training_events`/Outbox für idempotente Verarbeitung und nachvollziehbare Metadatenänderungen.

**Zählregeln:**
- Ein neues, **bereinigtes** Foto eines eindeutigen Kleidungsstücks + eine durch Nutzer explizit bestätigte Kategorie zählt höchstens **einmal** neu (mehrere Fotos desselben Items zählen nicht mehrfach). Opt-in/Trainingserlaubnis muss aktiv sein.
- KI-Vorschlag ohne Bestätigung zählt **nicht**.
- Änderung von Größe/Marke/Farbe aktualisiert Metadaten, erhöht aber **nicht** den 100er-Kategorie-Trainingszähler; zukünftig für separate Modelle nutzbar.
- Korrektur eines schon trainierten Kategorienlabels aktualisiert den aktuellen Datensatz und markiert ihn als korrigiert; sie erzeugt kein neues Item. Korrigierte Altlabels müssen beim nächsten Lauf enthalten sein, selbst wenn sie die 100er-Schwelle alleine nicht erfüllen; gesondert im Adminstatus anzeigen.
- Mehrfache Uploads/Duplikate mit perceptual hash erkennen; Trainings-/Test-Leakage verhindern. Unterschiedliche Zuschnitte derselben realen Kleidung müssen in demselben Train/Validation/Test-Split liegen.
- Löschen/Widerruf: Sample und Bild-Features aus zukünftigen Trainingsläufen ausschließen/löschen und von Backups nach geltender Retention behandeln. Bereits trainierte Modellgewichte verlieren diese Beiträge **nicht automatisch**; für Entfernen aus aktivem Modell Rebuild aus bereinigtem Datenbestand + Re-Evaluation/Modelldeployment planen. Keine falsche Zusage von sofortigem Machine-Unlearning.
- Benutzerseitige Einwilligung für Verwendung in globalem Trainingskorpus als separate, verständliche Einstellung; **Standard: nicht aktiviert** bis bewusst bestätigt. Keine privaten Originale für Training. Zugriffs- und Haushaltgrenzen wahren. Freigegebene Trainingsdaten sind intern, nicht öffentlich abrufbar.

## 8. Täglicher Trainingsjob – feste Regel

**Zeit:** täglich 03:30 Uhr, Zeitzone `Europe/Berlin`, bei verpasstem Termin nachholend. Mit systemd-Timer im LXC/Host analog bestehendem Update-Timer, aber **eigener** Service/Timer; Installation muss den korrekten absoluten Repo-Pfad verwenden. Kein externes Cron-SaaS.

**Schwelle:** mindestens **100 seit letztem erfolgreichen Trainingslauf neu hinzugekommene, eindeutige, zulässige und bestätigte Samples**. Korrekturen an alten Beispielen separat berücksichtigen. Nur bei repräsentativer Kategorieverteilung und Mindestanzahl je Klasse; ansonsten Lauf als `waiting_for_class_coverage` dokumentieren.

**Ablauf:**
1. Advisory Lock oder äquivalente Transaktionssperre sichern, niemals zwei gleichzeitige Läufe.
2. Aktuelle freigegebene Datensätze als konsistenten Snapshot erfassen, Validität aller Foto-Referenzen, Privacy-Version, Labels und Modellversionen prüfen.
3. Schwelle und CPU/RAM-/Disk-Headroom prüfen; bei Ressourcenmangel verschieben statt App zu gefährden.
4. MobileNetV3-Small-Features aus ausschließlich sanitizten Bildern generieren oder sicher gecachte Features laden; nur kleinen Klassifikationskopf auf *allen aktuellen* gültigen Beispielen trainieren.
5. Gegen fixen, streng getrennten Testbestand aus unterschiedlichen physischen Items evaluieren: Accuracy, Macro-F1, per-class Recall, Confusion-Matrix, offene/unsichere Fälle; nicht allein Accuracy.
6. Nur bessere oder mindestens nicht schlechtere Modelle nach festgelegten Grenzwerten atomar aktivieren, bisheriges Modell als Rollback behalten. Bei Fehler bisherigen Dienst nicht verändern.
7. Erfolgreichen Trainingsdaten-Snapshot als bearbeitet markieren; neue Beispiele während des Trainings fließen in den nächsten Lauf.
8. In Adminoberfläche Anzahl der Samples, Fortschritt 0–100, nächste Prüfung, letzte Laufzeit, Modellversion, Kategorieverteilung, Fehler und Rollback anzeigen. Keine privaten Bilder ohne berechtigten Zugriff in Admin-Logs.

Dokumentierte Statuswerte z. B. `waiting_for_samples`, `waiting_for_class_coverage`, `deferred_resources`, `running`, `rejected_quality`, `deployed`, `failed`.

## 9. Docker-/Deployment-Auftrag

Agent soll konkretes `services/clothing-ai/` mit Dockerfile, API, Inference, Security-/Preprocessing- und Segmentierungsadapter anlegen; `services/ai-trainer/` bzw. `training/` für Einmal-Worker/Training; Modelldateien als bind mount/Volume außerhalb des Git-Trackings. Compose-Profil `training`, Memory-/CPU-/PIDs-Limits und Read-Only-Container soweit realistisch.

- `ai_private` Docker-internal-Netz: nur App + AI; keine veröffentlichten Ports für AI.
- App behält bestehenden Netzwerk-/Datenbankzugriff, NPM/Authentik bleiben unverändert.
- `.env` liegt serverlokal; nur `.env.example` mit ungefährlichen Defaults. `.gitignore` + `.dockerignore` um `ai-models/`, Bilddaten, Trainings-Snapshots/Features und temporäre Dateien ergänzen.
- Auto-Deploy aus `scripts/deploy-on-push.sh` so erweitern, dass `clothing-ai` bei Modell-/Code-Änderungen gezielt neu gebaut werden kann, aber **niemals** Datenvolumes gelöscht oder produktive `.env` überschrieben werden. Trainer als Profil nicht dauerhaft starten.
- Keine Datenbankschemaänderung ohne nachvollziehbare Drizzle-Migration, bestehendes `docs/AUTO_DEPLOY.md` beachten. Tests zunächst auf Testinstanz.
- Image-/Model-Downloads nur bei bewusstem Setup, mit festgelegten Versionen, Lizenzen und Prüfsummen. Während regulärer Verarbeitung keine Netzwerkverbindung zu Hugging Face/GitHub.
- Alle API-Aufrufe timeout-/max-size-/concurrency-begrenzt; Healthchecks und strukturierte, datensparsame Logs.

## 10. Testfälle und verbindliche Abnahmekriterien

**Datenschutz (Blocker vor Produktivbetrieb):**
- [ ] Foto mit frontaler Person: Gesicht nicht sichtbar, Haut/Haar nicht im Kleiderbild; Hintergrund neutral; Kleidung möglichst vollständig.
- [ ] Mehrere Personen und Hintergrundgesicht: alle erkannten Gesichter vollständig maskiert; keines gelangt ins gespeicherte Bild.
- [ ] Seitliches/kleines/teilweise verdecktes Gesicht, Kindergesicht, Gesicht auf Print/Poster: Detektionsgrenzen mit Testdaten dokumentieren; bei unklaren Fällen **kein** unsanitizter Persistenz-Fallback.
- [ ] Flat-Lay ohne Person: Kleidungsstück vollständig sichtbar, Umgebung weitgehend entfernt.
- [ ] Grenzfall dunkle Kleidung vor dunklem Hintergrund, mehrere Kleidungsstücke, Gesicht direkt neben Jacke, Schuhe/Socken: korrekt segmentiert oder mit `needs_user_review/rejected` abgelehnt.
- [ ] Alle in Foto-API, Cache, Vorschaubildern und Trainingsdateien vorhandenen Bilder sind **nachweislich bereinigt**; EXIF/GPS/Metadaten fehlen.
- [ ] Modelldienst nicht erreichbar / Timeout / RAM-Limit erreicht: kein Original wird gespeichert; manuelle Item-Erfassung ohne Foto möglich.
- [ ] `createItem`/`addPhoto`: Berechtigungsprüfung vor Speicherung; unberechtigter Upload legt keine Datei an. DB-Abbruch erzeugt keine öffentlich abrufbare oder dauerhaft verwaiste Datei.
- [ ] Vorhandene Altfotos werden vor erzwungenem Privacy-Release migriert/quarantänisiert; keine unbereinigten Bestände über bestehende Routen abrufbar.

**ML-/Datenfluss:**
- [ ] `categoryId` wird in `createItem` und `updateItem` gegen DB-Kategorien validiert/gespeichert.
- [ ] Unbestätigte KI-Vorschläge erzeugen keine Trainingsbeispiele.
- [ ] Bestätigte Uploads und spätere Kategorie-Korrekturen aktualisieren exakt einen gültigen Datensatz pro physischem Item (bei mehreren Fotos dokumentierte Auswahlregel).
- [ ] Größe/Farbe allein erhöhen den 100er-Zähler nicht; Duplikate zählen nicht mehrfach.
- [ ] Opt-out und Löschung greifen auch bei Feature-Caches und zukünftigen Trainingsdaten.
- [ ] 99 neue freigegebene Beispiele: kein Training. 100: täglicher Check startet **nur bei ausreichender Daten-/Ressourcenqualität**; parallele Timerstarts ergeben einen Run.
- [ ] Neue Modellversion wird nur bei erfolgreicher Evaluation freigegeben; fehlerhafte Version/Unterbrechung verändert aktives Modell nicht.
- [ ] Kein Leak von Fotos desselben physischen Artikels über Train-/Test-Grenze.
- [ ] CPU-Last, Peak-RAM und Latenz auf tatsächlichem 8-GB-Proxmox-LXC dokumentieren; keine OOM-Probleme für App/DB.
- [ ] Kein externer KI-Aufruf, kein öffentlich erreichbarer AI-Port, serverlokale `.env` über Git-Deploy unverändert.

**Verifikation:** `npm run typecheck`, `npm run build`, bestehende Tests sowie neue Unit-/Integrationstests (Privacy-Fälle/Uploads/DB), Docker-Compose-Validierung und manuelle Handy-End-to-End-Prüfung. Testbilder nur synthetisch, mit Einwilligung oder mit geeigneter Lizenz; keine realen privaten Bilder ins öffentliche Git.

## 11. Umsetzungsschritte für den Agenten

1. Repository erneut lesen; Abweichungen dokumentieren, **erst danach** implementieren.
2. Kategoriepersistenz, Drizzle-Migration und Formularanbindung richtigstellen.
3. Kleines Proof-of-Concept **auf tatsächlicher CPU-/RAM-Hardware** für Gesichtserkennung + Fashion-/Flat-Lay-Segmentierung erstellen; Genauigkeit/Peak-RAM/Median- und P95-Laufzeit messen. Modell erst nach Qualitäts- und Lizenzprüfung auswählen.
4. Privacy-Gateway vor sämtliche Foto-Speicherpfade setzen. **Kein Persistieren bei unsicherem oder fehlgeschlagenem Processing.** Bestehende Bild-Autorisierung beibehalten.
5. Mobile UI für verarbeitete Vorschau, verständliche Fehler und Bestätigung implementieren.
6. MobileNetV3-Small + ONNX CPU-Klassifikation und DB-Kategorie-Mapping integrieren.
7. Trainingstabellen, Opt-in, idempotente Change-Erfassung und Lösch-/Korrekturmechanismen implementieren.
8. One-Shot-Trainingscontainer und täglichen Systemd-Check mit 100er-Schwelle ergänzen.
9. Qualitätsvergleich, Modellaktivierung/Rollback und schlankes Admin-Dashboard ergänzen.
10. Testfälle erfüllen, Daten-/Backup-/Migrationskonzept schreiben, `docs/SECURITY.md`, `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/TESTPLAN.md`, `docs/AUTO_DEPLOY.md` und README nach tatsächlicher Umsetzung aktualisieren.

**Lieferdefinition:** Zuerst ein kurzer Implementierungsplan/Abhängigkeitsliste und gemessene Modellentscheidung; dann funktionsfähige Änderungen mit Tests, Migrationen und aktualisierter Betriebsdokumentation. Bei nicht erfüllten Datenschutztests die Funktion **nicht** freischalten. Dies ist eine Implementierungsanleitung; die beschriebenen Dienste existieren derzeit nicht allein durch dieses Dokument.

## 12. Quellen und Nachschlagewerke

- Bestehender Code: `src/lib/photos.ts`, `src/actions.ts`, `src/db/schema.ts`, `src/app/wardrobe/new/NewItemForm.tsx`, `src/app/api/photos/[id]/route.ts`, `docker-compose.yml`.
- OpenCV YuNet (lokale Gesichtserkennung): https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet
- SegFormer Clothes (Fashion-/Human-Parsing; Evaluationskandidat, Lizenz prüfen): https://huggingface.co/mattmdjaga/segformer_b2_clothes
- ONNX Runtime CPU und Thread-Management: https://onnxruntime.ai/docs/performance/tune-performance/threading.html
- PyTorch MobileNetV3: https://docs.pytorch.org/vision/main/models/generated/torchvision.models.mobilenet_v3_small.html
- scikit-learn Logistic Regression: https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html
