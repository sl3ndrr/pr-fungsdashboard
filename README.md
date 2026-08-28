# Semester-Roadmap

Ein schlankes, responsives Dashboard für Prüfungen, Abgaben und persönliche Termine. Die Anwendung ist absichtlich frameworkfrei: Sie läuft direkt im Browser und benötigt keinen Build-Schritt.

## Funktionen

- Übersicht über anstehende Prüfungen, Abgaben und Termine
- Interaktiver Zeitstrahl mit Zeiträumen
- Monatlicher Kalender mit Detail-Popover
- Hell-, Dunkel- und Systemmodus
- Lokale Speicherung erledigter Abgaben
- Responsive Darstellung für Desktop und Mobilgeräte

## Projektstruktur

```text
.
├── assets/              # Bilder, Icons und weitere statische Dateien
├── css/
│   └── styles.css       # Gesamtes Styling, Themes und Responsive-Regeln
├── js/
│   ├── app.js           # Initialisierung, UI-Rendering und Interaktionen
│   ├── data.js          # Termine, Zeiträume, Icons und Konfiguration
│   ├── storage.js       # Persistenz erledigter Abgaben
│   └── utils.js         # Wiederverwendbare Datums- und HTML-Hilfen
├── .gitignore
├── index.html           # Semantisches Markup und Einbindung der Assets
└── README.md
```

## Lokal starten

Da es sich um eine statische Anwendung mit ES-Modulen handelt, sollte sie über einen lokalen Webserver geöffnet werden:

```bash
git clone https://github.com/sl3ndrr/pr-fungsdashboard.git
cd pr-fungsdashboard
python3 -m http.server 8000
```

Danach ist die Anwendung unter <http://localhost:8000> erreichbar.

Alternativ mit Node.js:

```bash
npx serve .
```

## Termine pflegen

Alle fachlichen Daten liegen zentral in [`js/data.js`](js/data.js):

- `EVENTS`: Prüfungen, Abgaben und Termine
- `PERIODS`: mehrtägige Zeiträume für Kalender und Zeitstrahl
- `isDone: true`: markiert eine Abgabe beim ersten Laden als erledigt
- `calOnly: true`: zeigt einen Termin nur im Kalender

Die Darstellung und Interaktionen müssen für neue Termine nicht angepasst werden.

## Änderungen veröffentlichen

```bash
git switch -c feature/meine-aenderung
git add .
git commit -m "feat: beschreibe die Änderung"
git push -u origin feature/meine-aenderung
```

Erstelle anschließend auf GitHub einen Pull Request nach `main`.
