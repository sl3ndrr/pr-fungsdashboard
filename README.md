# Semester-Roadmap

Ein schlankes, responsives Dashboard für Prüfungen, Abgaben und persönliche Termine. Die Anwendung ist absichtlich frameworkfrei: Sie läuft direkt im Browser und benötigt keinen Build-Schritt.

## Funktionen

- Nächster offener Termin mit großem Countdown, zwei Folgeterminen und aktuellem Zeitraum-Fortschritt
- Kennzahlen mit Fortschrittsbalken und Typfilter für die Terminliste
- Nach Heute, Kalenderwochen, Monaten und Vergangenheit gruppierte Terminkarten
- Interaktiver Zeitstrahl mit Prüfungsachse, horizontal entzerrten Punkten, Tooltips und Zeitraum-Bändern
- Abgebrochene Termine werden gedämpft dargestellt und aus der nächsten Fälligkeit ausgeblendet
- Monatlicher Kalender mit durchgehenden Zeitraum-Balken, Tagesdetails und Detail-Popover
- Neutrale Kategorie „Nur im Kalender“ für `calOnly`-Termine
- Hell-, Dunkel- und Systemmodus
- Lokale Speicherung erledigter Abgaben
- Responsive Darstellung mit einer, zwei oder drei Kartenspalten
- Tastaturbedienung, sichtbarer Fokus und Unterstützung für reduzierte Bewegung
- Tageswechsel aktualisiert Datum, Countdown und Ansichten automatisch

## Projektstruktur

```text
.
├── assets/              # Bilder, Icons und weitere statische Dateien
├── css/
│   └── styles.css       # Gesamtes Styling, Themes und Responsive-Regeln
├── js/
│   ├── app.js           # Initialisierung, UI-Rendering und Interaktionen
│   ├── data.js          # Termine, Zeiträume und Speicherschlüssel
│   ├── icons.js         # Statische SVG-Icons für alle UI-Bereiche
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
- `isCancelled: true`: markiert einen Termin als abgebrochen
- `calOnly: true`: zeigt einen Termin nur im Kalender

Die Darstellung und Interaktionen müssen für neue Termine nicht angepasst werden.

Der Typfilter betrifft ausschließlich die Terminliste. Die nächste Fälligkeit, Kennzahlen,
Zeitstrahl und Kalender behalten ihre vollständige Datenbasis. Ein Zeitstrahl-Punkt oder
„Danach“-Eintrag macht bei Bedarf die passende Karte sichtbar.

Die Zeitstrahl-Achse reicht von der ersten bis zur letzten Prüfung (auch abgebrochene
Prüfungen zählen als Achsengrenze). Der optische Rand beträgt an beiden Enden 4 % der
Datumsspanne. Liegt ein regulärer Termin außerhalb dieser Grenzen, erweitert sich die
Achse mit einer Konsolenwarnung. `calOnly`-Termine und Zeiträume verändern die Achse
nicht. Kollisionsgruppen werden nur horizontal und mit mindestens 32 px Abstand
verteilt; gleiche Daten behalten die Reihenfolge aus `EVENTS`.

Design-Tokens und beide Farbpaletten liegen in `css/styles.css`. `color-scheme` und
`light-dark()` wählen Hell, Dunkel oder das Systemdesign aus einer gemeinsamen
Definition. Outfit und Inter werden wie bisher über Google Fonts geladen; bei
fehlender Verbindung greift der System-Fallback. Es gibt keine neuen Abhängigkeiten.
Der Kalender kann auf sehr schmalen Geräten innerhalb seiner Fläche horizontal
gescrollt werden, damit alle Tages-Buttons mindestens 44 px breit bleiben.

## Änderungen veröffentlichen

```bash
git switch -c feature/meine-aenderung
git add .
git commit -m "feat: beschreibe die Änderung"
git push -u origin feature/meine-aenderung
```


Erstelle anschließend auf GitHub einen Pull Request nach `main`.

