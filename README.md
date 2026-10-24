# Semester-Roadmap

Ein schlankes, responsives Dashboard für Prüfungen, Abgaben und persönliche Termine. Die Anwendung ist absichtlich frameworkfrei: Sie läuft direkt im Browser und benötigt keinen Build-Schritt.

## Funktionen

- Nächster offener Termin mit großem Countdown, zwei Folgeterminen und aktuellem Zeitraum-Fortschritt mit Resttagen
- „Danach“-Buttons mit Wochentag, State-Layer und Fokus auf der Zielkarte
- Kennzahlen mit Fortschrittsbalken und Typfilter für die Terminliste
- Chronologische Terminkarten in einem gemeinsamen Grid; Zeitgruppen als Zeilenüberschrift und eindeutige Karten-Zuordnung
- Vollständig eingepasster Zeitstrahl mit linearen Tagen, beschrifteten Reihen, Zeitfensterwahl und tonalen Zeitraum-Bändern
- Abgebrochene Termine erhalten Status und Durchstreichung und werden aus der nächsten Fälligkeit ausgeblendet
- Monatlicher Kalender mit durchgehenden Zeitraum-Balken, Tagesdetails und Detail-Popover; zunächst ausgeblendet, ab 1200 px beim Öffnen als sticky Seitenspalte
- Neutrale Kategorie „Nur im Kalender“ für `calOnly`-Termine
- Hell-, Dunkel- und Systemmodus
- Lokale Speicherung erledigter Abgaben
- Responsive Darstellung mit einer bis vier Kartenspalten; ab 1600 px volle Inhaltsbreite und maximal vier Spalten
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

- `EVENTS` und `PERIODS`: bestehende Termine und Zeiträume des Sommersemesters 2026
- `SEMESTERS`: Semester mit eigener Bezeichnung, Umschaltdatum, `events` und `periods`
- `isDone: true`: markiert eine Abgabe beim ersten Laden als erledigt
- `isCancelled: true`: markiert einen Termin als abgebrochen
- `cancelReason`: optionaler kurzer String für den Status-Chip, z. B. „verschoben“;
  ohne Angabe steht dort neutral „Abgebrochen“. Der Zeitstrahl nennt zusätzlich
  den Status und gegebenenfalls den Grund. Bestehende Daten erhalten keine erfundenen Gründe.
- `calOnly: true`: zeigt einen Termin nur im Kalender
- `hideFromNext: true`: lässt einen Termin in „Als Nächstes“ und „Danach“ weg;
  Liste, Kalender, Zeitstrahl und Kennzahlen behalten ihn. Die bestehende
  Semestergrenze (`t2`) verwendet dieses Flag.

Bis einschließlich **30.11.2026** bleibt das **Sommersemester 2026** aktiv.
Am **01.12.2026 um 00:00 Uhr lokaler Gerätezeit** wechselt das Dashboard zum
**Wintersemester 2026/2027**, auch in einem bereits geöffneten Tab.
Der Termin „Beginn Wintersemester 2026/27“ am 26.10. löst keinen Ansichtswechsel aus.
Die aktive Semesterbezeichnung steht im Kopfbereich.

Wintertermine im Eintrag `id: 'ws-2026-2027'` unter `events: []`, Zeiträume unter
`periods: []` ergänzen. Beide Listen sind bewusst leer; ohne Termine zeigt das
Dashboard einen Leerzustand und der Kalender den aktuellen Monat. Die Sommerdaten
bleiben im Code erhalten. IDs müssen semesterübergreifend eindeutig sein, damit
gespeicherte Abgabe-Häkchen nicht auf neue Termine übertragen werden.

Die Darstellung und Interaktionen müssen für neue Termine nicht angepasst werden.

Der Typfilter betrifft ausschließlich die Terminliste. Die nächste Fälligkeit, Kennzahlen,
Zeitstrahl und Kalender behalten ihre vollständige Datenbasis. Ein Zeitstrahl-Punkt oder
„Danach“-Eintrag macht bei Bedarf die passende Karte sichtbar.

Der Zeitstrahl passt vollständig in seine Containerbreite. Die Connected Group
„Ab heute | Semester“ wählt das Fenster; die Wahl bleibt bei Re-Renders und
Tageswechsel erhalten. „Ab heute“ startet zwei Kalendertage vor heute und endet
zwei Tage nach dem letzten kommenden Haupttermin (mindestens fünf Tage nach
heute, wenn keine anstehen). „Semester“ zeigt alle Haupttermine mit zwei Tagen Rand.
Abgebrochene Termine bestimmen die Grenzen mit; `calOnly` und Zeiträume erweitern
sie nicht. Alle Koordinaten nutzen dieselbe lineare, DST-sichere Kalendertagsskala.

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

Design-Tokens und beide Farbpaletten liegen in `css/styles.css`. `color-scheme` und
`light-dark()` wählen Hell, Dunkel oder das Systemdesign aus einer gemeinsamen
Definition. Roboto Flex wird über Google Fonts geladen; bei
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

`withTransition(update, { type })` verwendet die View Transitions API, sofern
verfügbar und Bewegung erlaubt ist. Karten erhalten kollisionsfreie CSS-Namen aus
der Event-ID. Snapshot-Namen werden für die betroffene Interaktion aktiviert:
Karten und Gruppen beim Filtern, Kalendergrid/Titel beim Monatswechsel, Root beim
kreisförmigen Theme-Reveal. So laufen Checkbox-, Zahlen- und Balken-Transitions
weiter im echten DOM. Ohne API erfolgen gebündelte FLIP-Messungen und inerte
Exit-Kopien. Unterbrochene Snapshot-Updates werden einmal und in Reihenfolge
angewendet; unterbrochene WAAPI-Kanäle starten am aktuell sichtbaren Wert.
Geometrie für Hero/Countdown-Exits wird vor DOM-Schreiboperationen gesammelt.

### Animationsübersicht

| Bereich | Animation | Federart | Dauer |
| --- | --- | --- | --- |
| 1. Aufbau | 16 px Hochgleiten, .96 → 1, Fade; 25-ms-Staffelung ≤250 ms | Spatial / Effects | 410 / 210 ms |
| 2. Theme | Gemeinsamer Gruppenindikator, Icon, Reveal vom gewählten Button | Spatial-fast/slow / Effects | 350 / 570 / 210 ms |
| 3. Buttons | Ripple, Press .97, Pill → lg, Selected-Farbe | Spatial-fast / Effects | 350 / 140–300 ms |
| 4. Typfilter | Geteilter Indikator: Position, Breite, Gewicht | Spatial-fast / Effects | 350 / 210 ms |
| 5. Liste | Gemeinsames Grid, Shared-Element/FLIP, Scale/Fade für Karten und Zeilenüberschriften | Spatial / Effects | 350–410 / 140–210 ms |
| 6. Karten | Tonaler Hover/Press, Scroll, Wash/Bounce | Spatial-fast/default / Effects-slow | 350–410 / 300 ms |
| 7. Erledigt | Trailing-Checkbox, SVG-Häkchen, Form/Farbe, Titellinie, Statistik-Feder, Balken | Spatial-fast/slow / Effects | 350–570 / 140–210 ms |
| 8. Countdown | Maskierte Ziffernreels, initiales Hochzählen, imminent | Spatial-fast / Effects | 350 / 210 ms; Start 600 ms |
| 9. Fortschritt | Clip-Path, gemeinsame Transform-Wellenphase, flache Endpunkte | Spatial-slow / Effects | 570 / 210 ms; Phase 2,5 s |
| 10. Zeitstrahl | Punktstaffelung, Rail, Heute, Tooltip, Ring, Bänder | Spatial-fast/default/slow / Effects | 350–570 / 140–300 ms |
| 11. Kalender | Sticky Spalte ab 1200 px, Spalten-/Grid-Kollaps, Shared Axis, Tages-Morph, Details, Wochenbänder, Anker-Popover | Spatial-fast/default/slow / Effects | 350–570 / 140–210 ms |
| 12. Hero/Leerzustand | Container-Transform und Fade-Through / Shared Element | Spatial / Effects | 350–410 / 140–210 ms |

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

„Als nächstes“ stellt Zahl und Einheit auch auf schmalen Geräten untereinander
(„1 Tag“, „Heute“ ohne Einheit). Zeitraum-Fortschritt nennt Tag/Total und Resttage
auch in `aria-valuetext`, mit „letzter Tag“ am Ende. Statistik-Texte bleiben gleich.
„Danach“ bleibt ein echter Button (mindestens 56 px); Hover bei Hover-Geräten,
Fokus und Press verwenden Effects-State-Layer. Nach Auswahl wird die passende
Karte sichtbar, fokussiert und gemäß Reduced Motion gescrollt. Die kurzen Datumsangaben
entstehen mit `Intl.DateTimeFormat('de-DE')` aus lokal geparsten Kalendertagen.

### Reduced Motion

`prefers-reduced-motion: reduce` und ein Live-`matchMedia`-Listener entfernen
räumliche Interpolation, Überschwingen, Ripple-Ausdehnung, Ziffernrollen und
Dauerbewegung. Wellen stehen still; Scrollen verwendet `auto`. Zustandsfeedback
bleibt als Effects-Fade mit 140 ms erhalten. Laufende WAAPI-Animationen und View
Transitions werden beim Wechsel beendet. Es gibt keinen globalen
`animation: none !important`-Schalter.

### Bewusste Abweichungen

- Eine Web-Nachbildung, keine pixelgenaue Android-17-/Compose-Implementierung.
  Die zeitbasierten Samples und Bezier-Fallbacks sind keine physikalischen
  Federintegratoren; Retargeting erhält den sichtbaren Wert, keine Feder-Velocity.
- Die Palette ist von Hand auf die vorhandenen semantischen Farbtöne abgestimmt,
  ohne Android-Dynamic-Color. Bestehende Zeitraumfarben bleiben erhalten.
- Der Wavy Indicator nutzt eine unskalierte, rechts beschnittene CSS/SVG-Mask und eine
  Überblendung zur geraden Linie; die Füllgrenze erhält eine eigene kleine
  Markierung. Die Compose-Wellengeometrie wird nicht exakt reproduziert.
- Tooltips/Popover bleiben montiert und verwenden Opacity/Scale mit verzögerter
  Visibility; Kalender/Details verwenden Grid plus `inert`/ARIA. Das ermöglicht
  Exit-Animationen auch ohne `allow-discrete`. `@starting-style` ergänzt den Einstieg.
- Snapshot-Namen sind auf wechselnde Regionen begrenzt, damit stabile Controls
  ihre echten Transitions behalten. Hero-Wechsel verwenden einen eigenen inerten
  Exit-Snapshot und Fade-Through.
- Zeitstrahl-Buttons erhalten mindestens 44-px-Hitflächen; beschriftete Reihen vermeiden Kollisionen.
  Hitflächen und Beschriftungen sind über disjunkte Reihen zugeordnet.

### Komponenten-Konsistenz

Theme, Typfilter, Zeitfenster und Vergangene-Toggle verwenden `segmented-filter`
und denselben Indikator. Theme behält Radiogroup, Pfeiltasten/Home/End und
`theme_pref`; Filter verwenden `aria-pressed`. Alle Buttons sind mindestens 44 px hoch.
Hero-Dringlichkeit verwendet Gewicht bei ≤7 Tagen und `error-container` bei ≤3 Tagen,
keinen inset-Ring. „Als Nächstes“/„Danach“ verwenden Title Small in Normalschreibung.
Die Hero-Form (32 px, 16 px Innenabstand) und die inneren Reihen (16 px) sind konzentrisch.
Dekorative Rahmen entfallen; die Kalenderzellen behalten eine 3:1-Outline und die
Checkboxen ihre funktionale Begrenzung. Farben außerhalb der Palette sind Rollen
oder die unveränderten Zeitraumwerte. Weiße SVG-Masken bestimmen nur Alpha, keine UI-Farbe.

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

| M3-Klasse | Breite | Übersicht |
| --- | --- | --- |
| Compact | < 600 px | Hero mit Zahl neben Titel, danach Zeitstrahl und Statistik |
| Medium | 600–839 px | Hero, Zeitstrahl, Statistik gestapelt |
| Expanded | 840–1199 px | Hero links; Zeitstrahl und vollbreite Statistik rechts |
| Large | 1200–1599 px | Zwei Übersichtsspalten; optional sticky Kalender rechts neben Liste |
| Extra-large | ≥ 1600 px | Volle Inhaltsbreite, Hero bis 560 px, Rest für Übersicht/Liste |

Die Übersichtsspalten strecken sich auf dieselbe Gesamthöhe. Drei gleich breite
Statistik-Kacheln füllen die rechte Spalte. Die intrinsischen Container Queries
der Terminliste (660/1000/1300 px) bleiben unabhängig von Fensterklassen.
Die bisherige Kalendergrenze 1280 px ist bewusst auf Large (1200 px) migriert;
die Seitenspalte bleibt 380–440 px breit, sticky und standardmäßig geschlossen.
Hero- und Kartentitel nutzen deutsche automatische Trennung und `break-word`.
