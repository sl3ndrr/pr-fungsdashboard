# Semester-Roadmap

Ein schlankes, responsives Dashboard für Prüfungen, Abgaben und persönliche Termine. Die Anwendung ist absichtlich frameworkfrei: Sie läuft direkt im Browser und benötigt keinen Build-Schritt.

## Funktionen

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
│   ├── layout.js        # Reine Fenster-, Skalen-, Label-/Lane- und Overlay-Geometrie
│   ├── motion.js        # Federn, DOM-Abgleich und View-Transition-/FLIP-Helfer
│   ├── storage.js       # Persistenz erledigter Abgaben
│   └── utils.js         # Wiederverwendbare Datums- und HTML-Hilfen
├── tests/               # Node-Regressionen; Playwright separat in visual/
├── docs/                # Designentscheidungen, Browser-Anleitung, Abnahmebericht
├── scripts/             # CSS-Inventar und Scanner
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

Bis einschließlich **30.11.2026** bleibt das **Sommersemester 2026** aktiv.
Am **01.12.2026 um 00:00 Uhr lokaler Gerätezeit** wechselt das Dashboard zum
**Wintersemester 2026/2027**, auch in einem bereits geöffneten Tab.
Der Termin „Beginn Wintersemester 2026/27“ am 26.10. löst keinen Ansichtswechsel aus.
Die aktive Semesterbezeichnung steht im Kopfbereich.

Die Darstellung und Interaktionen müssen für neue Termine nicht angepasst werden.

Jeder Punkt trägt Kurzname und Datum oder bei Platzmangel ein Datum. Kollisionen
weichen in abwechselnde Reihen ober-/unterhalb der Achse aus. Gleiche Daten behalten
die Reihenfolge aus `EVENTS`. Punkt und Beschriftung bilden einen nativen Button
mit mindestens 44 × 44 px. Ein Klick/Tap führt sofort zur Karte und setzt nötige
Listenfilter zurück. Der nächste offene Termin ist gefüllt hervorgehoben;
`hideFromNext` bleibt sichtbar, wird aber dabei übersprungen.

Hover/Fokus mit Hover-Gerät öffnet zusätzlich einen viewportbegrenzten Tooltip
mit Details und Status, Escape schließt ihn. Abbrüche erhalten Durchstreichung und
zugänglichen Status. Tonale Zeitraum-Bänder werden am Fenster abgeschnitten,
ihre Labels bleiben vollständig. Monatsnamen heißen „Okt 2026“, danach „Nov“;
der Jahreswechsel ergänzt erneut das Jahr. Die Heute-Pille liegt über ihrer Linie.
Die kompakte Legende enthält die sichtbaren Typen und den Abbruchstatus.
Ein ResizeObserver reagiert ausschließlich auf geänderte Containerbreite;
es gibt keinen horizontalen Zeitstrahl-Scroller und kein Scroll-Layout.

## Änderungen veröffentlichen

```bash
git switch -c feature/meine-aenderung
git add .
git commit -m "feat: beschreibe die Änderung"
git push -u origin feature/meine-aenderung
```


Erstelle anschließend auf GitHub einen Pull Request nach `main`.



## Designsystem & Motion

Das Dashboard bildet Material 3 Expressive im Web nach: tonale Flächen,
großzügige Formen, betonte variable Typografie und getrennte Bewegungsarten.
Alle Tokens stehen in `:root` in `css/styles.css`; `color-scheme` und `light-dark()`
wählen die gemeinsame Hell-/Dunkel-Palette. Prüfung bleibt rot (`error`), Abgabe
blau (`primary`), Termin grün (`tertiary`). Surface-Container ersetzen überwiegend
Schatten. Die Shape-Skala umfasst 4, 8, 12, 16, 20, 28, 32, 48 und 9999 px.
Roboto Flex verwendet variable `wght`/`wdth`-Achsen mit System-Fallback; die
Display-, Headline-, Title-, Body- und Label-Tokens liegen neben Emphasized-Gewichten.
State-Layer: Hover 8 %, Fokus/Pressed 10 %, Disabled Inhalt 38 % und Fläche 12 %.

### Federwerte und Regeln

| Art | Geschwindigkeit | Dämpfung / Steifigkeit | Dauer |
| --- | --- | --- | --- |
| Spatial | fast | 0,6 / 800 | 350 ms |
| Spatial | default | 0,8 / 380 | 410 ms |
| Spatial | slow | 0,8 / 200 | 570 ms |
| Effects | fast | 1,0 / 3800 | 140 ms |
| Effects | default | 1,0 / 1600 | 210 ms |
| Effects | slow | 1,0 / 800 | 300 ms |

Position, Größe, Form, Rotation und Ziffernreels verwenden Spatial und dürfen
überschwingen. Farbe und Opacity verwenden Effects und überschwingen nicht.
Dauern gehören zu ihren Kurven. CSS-`linear()` verwendet die Samples aus dem
Designauftrag; ein `@supports`-Fallback und der WAAPI-Helfer verwenden ersatzweise
Bezier-Kurven. Räumliche Bewegung setzt bevorzugt Transform/Scale/Clip-Path ein;
Höhenwechsel verwenden Grid-Zeilen. `top`/`left` werden nur statisch für Anker und
inert gerenderte Exit-Kopien gesetzt. Es gibt kein dauerhaftes `will-change`.

### Render-Strategie

`syncHTML()` / `syncChildren()` gleichen Vorlagen mit dem bestehenden DOM ab.
IDs, Event-IDs, Datum und Gruppenschlüssel halten Knoten stabil. Zahlen, Checkboxen,
Fortschritt und der Filter-Indikator aktualisieren ihre vorhandenen Elemente.
Listener werden einmal gebunden. Fokus und Scrollpositionen bleiben über
`focusAfterRender()` / `renderPreservingState()` erhalten. Nur der Start ruft
`render(true)` mit Enter-Staffelung auf. Tageswechsel, Filter, Erledigt und Resize
verwenden den Fokus-/Scrollschutz ohne Enter-Staffelung.

### Animationsübersicht

Wellen werden mit einer kleinen SVG-Mask dargestellt. Die Amplitude nimmt nahe
0 % und 100 % ab und überblendet in eine gerade Linie. Die langsame Phase läuft
nur im normalen Bewegungsmodus; volle/leere Balken sind statisch. Track und Füllung animieren ihre Pseudo-Elemente mit derselben linearen
`transform: translateX(...)`-Phase. Die vererbte registrierte Wellen-Property
entfällt. Volle/leere Balken und Reduced Motion pausieren beide Pseudo-Elemente.
Der Füllwert animiert über Clip-Path mit Spatial-slow; die Zeitstrahl-Pille ändert
ihre Breite ohne skalierte Endkappen. Ein Compositor-/Performance-Nachweis
bleibt bis zum echten Browser-Trace offen.
Der SVG-Pfad läuft über beide Kachelränder hinaus, damit keine Stroke-Enden
an den Wiederholungsnähten liegen. Eine kleine senkrechte Markierung am
Zeitraum-Balken zeigt die Füllgrenze auch unabhängig von der Farbe. Sie folgt
derselben Spatial-slow-Bewegung wie die Füllung und steht bei Reduced Motion
sofort am neuen Wert; an 0/100 % bleibt sie innerhalb des Balkens.

### Reduced Motion

`prefers-reduced-motion: reduce` und ein Live-`matchMedia`-Listener entfernen
räumliche Interpolation, Überschwingen, Ripple-Ausdehnung, Ziffernrollen und
Dauerbewegung. Wellen stehen still; Scrollen verwendet `auto`. Zustandsfeedback
bleibt als Effects-Fade mit 140 ms erhalten. Laufende WAAPI-Animationen und View
Transitions werden beim Wechsel beendet. Es gibt keinen globalen
`animation: none !important`-Schalter.

### Bewusste Abweichungen

### Komponenten-Konsistenz

### Prüfungen und offener Browsernachweis

```bash
TZ=Europe/Berlin node --test tests/
node --test scripts/css-duplicates.test.mjs
```

Die aktuelle Änderung besteht **40/40 Node-Tests** und **3/3 Scanner-Tests**.
Dazu gehören lineare Skala, DST, Fenster, leere/einzelne/gleichdatierte Termine,
Kollisionen, zugängliche Statuswerte, Farbrollen, Motion und der unveränderte Daten-Fingerprint.
Die Browsermatrix ist vorbereitet, **nicht bestanden**: 372 Fälle werden über
Chromium/Firefox/WebKit erkannt. Lokale Browser-Binaries fehlen; der Download wird
mit HTTP 403 blockiert. Der Cloud-Browser erreicht den lokalen Server nicht;
eingebettete `data:`-Navigation ist ebenfalls untersagt. Es gibt keine neuen,
angesehenen Screenshots, DOM-Höhen, Touch- oder Performance-Messungen.

Die Browser-Regression unter <http://localhost:8000/tests/regression.html> bleibt
als zusätzliche manuelle Testseite erhalten. Reproduktionsbefehle und die
Screenshot-Regeln stehen in [docs/visual-tests.md](docs/visual-tests.md).
Der detaillierte Stand aller elf Abnahmekriterien einschließlich fehlender
Höhenmesswerte steht in [docs/verification-report.md](docs/verification-report.md).

## Fensterklassen und Übersicht