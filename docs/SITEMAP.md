# Sitemap

```text
/                            Dashboard oder Authentik-Login
├── wardrobe                 Kleiderschrank, Suche und Filter
│   ├── new                  Kleidungsstück erfassen
│   ├── history              Frühere Weitergaben
│   └── [id]                 Details, Fotos, Bearbeiten, Verlauf
├── packages                 Pakete erstellen / Übersicht
│   └── [id]                 Packen, Empfänger, Absenden
├── transfers                Eingänge, Annahme, Leihgaben, Rückgaben
├── family                   Haushalte, Mitglieder, Einladungscode, Kontakte
└── notifications            Benachrichtigungen

/api/auth/[...nextauth]       Authentik-OIDC-Callback und Sessions
/api/health                  Technischer Status
/api/photos/[id]             Authentifizierte Fotoauslieferung
```

Auf dem Smartphone liegen die vier Hauptbereiche in der unteren Navigation:
**Übersicht · Kleidung · Pakete · Familie**.
