# Semester-Roadmap

Ein schlankes, responsives Dashboard für Prüfungen, Abgaben und persönliche Termine. Die Anwendung ist absichtlich frameworkfrei: Sie läuft direkt im Browser und benötigt keinen Build-Schritt.

## Funktionen

- Nächster offener Termin mit großem Countdown, zwei Folgeterminen und aktuellem Zeitraum-Fortschritt mit Resttagen
- „Danach“-Buttons mit Wochentag, State-Layer und Fokus auf der Zielkarte
- Kennzahlen mit Fortschrittsbalken und Typfilter für die Terminliste
- Nach Heute, Kalenderwochen, Monaten und Vergangenheit gruppierte Terminkarten
- Interaktiver Zeitstrahl mit Prüfungsachse, horizontal entzerrten Punkten, Tooltips und Zeitraum-Bändern
- Abgebrochene Termine erhalten einen Status-Chip und durchgestrichenen Titel und aus der nächsten Fälligkeit ausgeblendet
- Monatlicher Kalender mit durchgehenden Zeitraum-Balken, Tagesdetails und Detail-Popover
- Neutrale Kategorie „Nur im Kalender“ für `calOnly`-Termine
- Hell-, Dunkel- und Systemmodus
- Lokale Speicherung erledigter Abgaben
- Responsive Darstellung mit einer, zwei oder drei Kartenspalten; ab 1560 px volle Inhaltsbreite und zusätzliche Spalten je nach verfügbarem Platz
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
│   ├── motion.js        # Federn, DOM-Abgleich und View-Transition-/FLIP-Helfer
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
- `cancelReason`: optionaler kurzer String für den Status-Chip, z. B. „verschoben“;
  ohne Angabe steht dort neutral „Abgebrochen“. Der Zeitstrahl nennt zusätzlich
  den Status und gegebenenfalls den Grund. Bestehende Daten erhalten keine erfundenen Gründe.
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

Datumsstriche und Gruppendaten unter den Punkten entfallen; Monatsmarken bleiben.
Datum und Status stehen im zugänglichen Namen und Tooltip jedes Punkts. Fokus
öffnet den Tooltip, Escape schließt ihn; bei Touch zeigt die erste Berührung die
Details und die zweite führt zur Karte. Tooltips erhalten Platz oberhalb beider
Zeitraum-Zeilen. Die Legende trennt Terminarten, Status und Zeiträume.
Beim ersten Layout wird „Heute“ sofort innerhalb des Zeitstrahl-Containers
zentriert und an dessen Scrollgrenzen begrenzt. Fonts und Containerbreiten können
die Startposition korrigieren, bis die Person den Zeitstrahl selbst bedient;
spätere Render und Tageswechsel setzen ihre Scrollposition nicht zurück.

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
`focusAfterRender()` / `renderPreservingState()` erhalten. Nur Start und Tageswechsel
rufen `render(true)` mit Enter-Staffelung auf; Filter/Erledigt/Resize tun das nicht.

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
| 2. Theme | Thumb/Shape/Icon, Reveal vom Thumb, Farb-Fallback | Spatial-fast/slow / Effects | 350 / 570 / 210 ms |
| 3. Buttons | Ripple, Press .97, Pill → lg, Selected-Farbe | Spatial-fast / Effects | 350 / 140–300 ms |
| 4. Typfilter | Geteilter Indikator: Position, Breite, Gewicht | Spatial-fast / Effects | 350 / 210 ms |
| 5. Liste | Shared-Element/FLIP, Scale/Fade für Ein-/Austritt, Gruppen | Spatial / Effects | 350–410 / 140–210 ms |
| 6. Karten | Tonaler Hover/Press, Scroll, Wash/Bounce | Spatial-fast/default / Effects-slow | 350–410 / 300 ms |
| 7. Erledigt | SVG-Häkchen, Form/Farbe, Titellinie, Badge, Balken | Spatial-fast/slow / Effects | 350–570 / 140–210 ms |
| 8. Countdown | Maskierte Ziffernreels, initiales Hochzählen, imminent | Spatial-fast / Effects | 350 / 210 ms; Start 600 ms |
| 9. Fortschritt | Clip-Path, gemeinsame Wavy-Phase, flache Endpunkte | Spatial-slow / Effects | 570 / 210 ms; Phase 2,5 s |
| 10. Zeitstrahl | Punktstaffelung, Rail, Heute, Tooltip, Ring, Bänder | Spatial-fast/default/slow / Effects | 350–570 / 140–300 ms |
| 11. Kalender | Grid-Kollaps, Shared Axis, Tages-Morph, Details, Wochenbänder, Anker-Popover | Spatial-fast/default/slow / Effects | 350–570 / 140–210 ms |
| 12. Hero/Leerzustand | Container-Transform und Fade-Through / Shared Element | Spatial / Effects | 350–410 / 140–210 ms |

Wellen werden mit einer kleinen SVG-Mask dargestellt. Die Amplitude nimmt nahe
0 % und 100 % ab und überblendet in eine gerade Linie. Die langsame Phase läuft
nur im normalen Bewegungsmodus; volle/leere Balken sind statisch. Die registrierte,
vererbte Property `--wave-shift` am Balken treibt Track und Füllung gemeinsam an.
Der Füllwert animiert über Clip-Path mit Spatial-slow; die Zeitstrahl-Pille ändert
ihre Breite ohne skalierte Endkappen. Ohne Property-Registrierung bleibt die
Phase zwischen beiden Layern gleich, kann aber nur diskret interpolieren.

„Als nächstes“ stellt Zahl und Einheit auch auf schmalen Geräten untereinander
(„1 Tag“, „Heute“ ohne Einheit). Zeitraum-Fortschritt nennt Tag/Total und Resttage
auch in `aria-valuetext`, mit „letzter Tag“ am Ende. Statistik-Texte bleiben gleich.
„Danach“ bleibt ein echter Button (mindestens 56 px); Hover bei Hover-Geräten,
Fokus und Press verwenden Effects-State-Layer. Nach Auswahl wird die passende
Karte sichtbar, fokussiert und gemäß Reduced Motion gescrollt. Die kurzen Daten
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
  Überblendung zur geraden Linie; Compose-Wellengeometrie und Stop-Indicator
  werden nicht exakt reproduziert.
- Tooltips/Popover bleiben montiert und verwenden Opacity/Scale mit verzögerter
  Visibility; Kalender/Details verwenden Grid plus `inert`/ARIA. Das ermöglicht
  Exit-Animationen auch ohne `allow-discrete`. `@starting-style` ergänzt den Einstieg.
- Snapshot-Namen sind auf wechselnde Regionen begrenzt, damit stabile Controls
  ihre echten Transitions behalten. Hero-Wechsel verwenden einen eigenen inerten
  Exit-Snapshot und Fade-Through.
- Zeitstrahl-Punkte behalten die 32-px-Kollisionslogik und erhalten 44-px-Hitflächen.
  Benachbarte Hitflächen können sich dadurch überlappen; die unveränderten
  Punktzentren und Tastaturbedienung haben Vorrang.

### Prüfungen und offene Freigabe

Ohne zusätzliche Pakete mit Node.js 24:

```bash
TZ=Europe/Berlin node --test tests/
```

Die automatisierten Node-Checks prüfen: Motion-Kanäle und Unterbrechungen, schnelle
View-Transition-Updates, Live-Reduced-Motion, `linear()`-Fallback, eindeutige
CSS-Namen, rechnerische AA-Kontraste der Rollen, Fortschritt/Past-Punkte,
Zeitstrahl-Achse/Kollisionen und DST-Tagesberechnung. Syntax aller ES-Module,
HTML-Struktur/IDs und `git diff --check` sind zusätzlich geprüft. Die Daten-,
Storage-, Icon- und Datumshilfs-Module wurden nicht geändert.

Die lokale Browser-Testseite ist nach Start des HTTP-Servers unter
<http://localhost:8000/tests/regression.html> erreichbar. Sie prüft 360, 768, 1280
und 1600 px mit nativer API und erzwungenem View-Transition-Fallback, einschließlich
Filter, Knoten-/Fokuserhalt, Erledigt, Kalender, Popover, Themes und Tageswechsel.
Die Fixture verwendet isolierten In-Memory-Speicher und ein festes Datum.

**Noch offen:** Diese Browser-Testseite und die visuellen Prüfungen für Fix 1–6 wurden hier nicht
ausgeführt: Chromium-/Firefox-/WebKit-Binaries fehlen, und der Cloud-Browser
blockiert die lokale Vorschau (`ERR_BLOCKED_BY_CLIENT`). Deshalb bleiben visuelle
Prüfungen in allen drei Browsern, die vollständige Tastatur-/ARIA- und Kontrast-
Prüfung, echte Reduced-Motion-Emulation sowie ein Performance-Trace mit 4× CPU und
60-fps-Nachweis offen. Der Nutzer hat die Implementierung ohne Vorab-Reproduktion ausdrücklich erlaubt.
Die drei PRs (Fixes, visuelle Tests, CSS-Hygiene) bleiben bis zur Browser-Prüfung
Entwürfe; die
Implementierungs-Checkliste ist kein vollständiger Nachweis der Definition of Done.

Referenzen und der abgearbeitete Plan: [`docs/design-plan.md`](docs/design-plan.md).


### Visuelle Regressionen (PR B)

Playwright 1.62.1 ist die einzige neue direkte Abhängigkeit und liegt ausschließlich
als Dev-Werkzeug mit eigenem Paket in `tests/visual/`. Anwendung und Python-HTTP-
Vorschau bleiben ohne Build. `node --test tests/` benötigt diese Abhängigkeit nicht.
Chromium/Firefox/WebKit prüfen 360/768/1280/1600 px, Hell/Dunkel, Komponenten,
Status und eine kleine Reduced-Motion-Variante.

Aus dem Repo-Verzeichnis im gepinnten offiziellen Image ausführen:

```bash
docker run --rm --ipc=host -v "$PWD:/work" -w /work/tests/visual \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -lc 'npm ci --ignore-scripts && npm test'
```

Zum Aktualisieren der Baselines im selben Befehl `npm test` durch `npm run update`
ersetzen, die PNGs prüfen und `tests/visual/__snapshots__/` einchecken.
Datum, Fixtures, Wellenzeiten und die Gegenprobe vor PR A sind in
[`docs/visual-tests.md`](docs/visual-tests.md) dokumentiert. Ein CI-Workflow ist
nur vorgeschlagen. Docker-/Browserläufe, eingecheckte Baselines und die
Vor-A-Gegenprobe stehen noch aus; PR B bleibt ein Entwurf.
