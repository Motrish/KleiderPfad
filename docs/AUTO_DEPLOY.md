# Automatische Updates von GitHub

Ziel: Nach Änderungen an `main` soll KleiderPfad automatisch neu gebaut und neu gestartet werden, **ohne die Server-`.env` oder Docker-Volumes zu verändern**.

## Sicherheits- und Datenregeln

- `.env` ist in `.gitignore` und `.dockerignore` ausgeschlossen und liegt dauerhaft auf dem Docker-Host.
- Das Skript beendet sich sofort, wenn `.env` fehlt, doch von Git verfolgt wird oder nicht ignoriert wird.
- `git fetch` und `git merge --ff-only` ziehen nur verwaltete Git-Dateien; es wird **kein `git clean`**, **kein `docker compose down -v`**, **kein `docker volume rm`** ausgeführt.
- Die App wird neu gebaut und mit `docker compose up -d --no-build app` aktualisiert; PostgreSQL wird nicht absichtlich neu erstellt, die Volumes bleiben erhalten.
- Ein fehlgeschlagener Build beendet den Vorgang, bevor Container aktualisiert werden.
- Bei Fehlern nach einem Neustart zeigt das Journal das Problem; es gibt **keinen automatischen Rollback**.
- GitHub-Updates werden ausschließlich von `main` übernommen. Lokale Änderungen an Git-verfolgten Dateien führen zu einem Stopp statt zu Datenverlust.
- **Schemaänderungen:** derzeit noch keine produktionsreifen automatischen SQL-Migrationen. Bei Änderungen an `src/db/schema.ts` die erforderlichen Datenbankmigrationen separat durchführen. Das Deploy-Skript führt bewusst **kein automatisches `db:push`** aus.

## Option A (empfohlen für Heimserver): systemd-Timer

Kein eingehender SSH-Zugang, keine GitHub-Secrets, kein zusätzlicher Container. Der Server prüft `main` etwa einmal pro Minute. Er baut nur bei einem noch nicht erfolgreich deployten Commit.

1. Ins Repository auf dem **Docker-Host** wechseln. Die Datei `.env` muss bereits lokal vorhanden sein.
2. Als normaler Benutzer ausführen, der Docker **ohne sudo** nutzen darf:

```bash
cd /pfad/zu/KleiderPfad
bash scripts/install-auto-update.sh
```

Der Installer legt `kleiderpfad-update.service` und `kleiderpfad-update.timer` unter `/etc/systemd/system/` an, aktiviert den Timer und führt einen ersten Update-Check aus.

Status und Logs:

```bash
systemctl status kleiderpfad-update.timer
systemctl list-timers kleiderpfad-update.timer
journalctl -u kleiderpfad-update.service -f
```

Sofort manuell aktualisieren:

```bash
sudo systemctl start kleiderpfad-update.service
```

Timer deaktivieren:

```bash
sudo systemctl disable --now kleiderpfad-update.timer
```

Das betrifft nur automatische Git-Updates, nicht die laufenden Docker-Container.

## Option B (direkt nach erfolgreicher GitHub-CI): GitHub Actions → SSH

Die Workflow-Datei `.github/workflows/deploy.yml` ist im Repository. Sie ist **standardmäßig deaktiviert** und startet erst nach der Konfiguration. Sie verbindet sich nach erfolgreicher CI auf einem Push nach `main` über SSH mit dem Server und führt dasselbe Skript aus.

Voraussetzung: Dein Server muss vom GitHub-hosted Runner aus über SSH erreichbar sein (z. B. über einen bewusst abgesicherten Netzwerkweg). **Du musst keinen SSH-Port ins Internet freigeben, wenn du Option A verwendest.**

### 1. SSH-Schlüssel und Benutzer

Auf einem vertrauenswürdigen Rechner einen eigenen Deploy-Schlüssel anlegen:

```bash
ssh-keygen -t ed25519 -f ./kleiderpfad-deploy -C kleiderpfad-github-actions
```

Den **Public Key** `kleiderpfad-deploy.pub` beim Deploy-Benutzer auf dem Server in `~/.ssh/authorized_keys` hinterlegen. Der Benutzer benötigt Leserechte auf das Repository und die `.env` sowie Berechtigung zur Ausführung von Docker Compose. Den Private Key niemals in Git committen.

### 2. GitHub Einstellungen

Unter **Repository → Settings → Secrets and variables → Actions**:

**Secrets:**

| Name | Wert |
|---|---|
| `DEPLOY_HOST` | öffentlich/über Runner erreichbarer SSH-Host |
| `DEPLOY_USER` | dedizierter SSH-Deploy-Benutzer |
| `DEPLOY_SSH_PRIVATE_KEY` | vollständiger Private-Key-Inhalt |
| `DEPLOY_KNOWN_HOSTS` | verifizierter SSH-Host-Key-Eintrag, inkl. Host/Port |

**Variables:**

| Name | Wert |
|---|---|
| `DEPLOY_PATH` | absoluter Pfad zum geklonten Repository auf dem Server, z. B. `/opt/KleiderPfad` |
| `DEPLOY_PORT` | SSH-Port, standardmäßig `22` |
| `SSH_DEPLOY_ENABLED` | erst nach Konfiguration `true` setzen |

Für `DEPLOY_KNOWN_HOSTS` die Fingerprints des SSH-Servers *unabhängig prüfen*, nicht ungeprüft Schlüssel übernehmen. Bei Nichtstandard-Port muss der Host-Eintrag den Port enthalten.

### 3. Test

Unter **Actions → Deploy via SSH (optional) → Run workflow** testen. Danach wird bei jedem erfolgreichen Build von `main` automatisch bereitgestellt. Ist zum Deploy-Zeitpunkt bereits ein neuerer Commit auf `main`, überspringt das Skript die veraltete Revision.

## Nicht beide Varianten nötig

Nutze **Option A** für einen privaten Server ohne SSH-Erreichbarkeit von GitHub. **Option B** passt, wenn ein sicherer SSH-Verbindungsweg bereits besteht und du unmittelbar nach erfolgreicher CI deployen willst. Beide Varianten können technisch dieselbe Skriptdatei nutzen, aber die parallele Einrichtung bringt meist keinen Mehrwert.

## Fehlersuche

```bash
git status --short
git check-ignore .env
docker compose ps
docker compose logs --tail=100 app
journalctl -u kleiderpfad-update.service -n 100 --no-pager
```

Prüfen, welcher Commit zuletzt erfolgreich gestartet wurde:

```bash
git rev-parse --short HEAD
cat .git/kleiderpfad-last-deployed
```
