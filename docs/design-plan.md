# Material 3 Expressive – Design-Plan

## Bestandsaufnahme vor Änderungen

`index.html`, `css/styles.css` und `js/app.js` vollständig gelesen. Fast alle
Ansichten werden durch `innerHTML` ersetzt. Dadurch verlieren Checkboxen, Zahlen,
Fortschrittsbalken und Karten ihre laufenden Transitions. Die Datumsberechnung und
horizontale Kollisionsverteilung bleiben unverändert.

**Verbindliche Re-Render-Strategie:** keyed DOM-Abgleich mit IDs, Event-IDs, Datum
und Gruppenschlüsseln. Vorlagen dürfen neu erzeugt werden; bestehende DOM-Knoten
bleiben erhalten. Listener nur einmal binden. `renderPreservingState()` löst nie
Enter aus; Start und Tageswechsel verwenden `render(true)` mit Fokus-/Scrollschutz.
`withTransition(update, { type })` nutzt View Transitions, andernfalls batched FLIP
mit inertem Exit-Snapshot. Snapshot-Namen gelten nur in betroffenen Bereichen:
Karten/Gruppen beim Filtern, Kalender beim Monatswechsel, Root beim Theme-Reveal.
Stabile Checkboxen, Zahlen und Balken behalten ihre echten CSS-Transitions.

## Token-Tabelle

| Familie | Ziel |
| --- | --- |
| Farbe | primary blau, error rot, tertiary grün; on/container/surface/outline mit light-dark |
| State-Layer | Hover 8 %, Fokus/Press 10 %, Disabled Inhalt 38 % / Fläche 12 % |
| Shape | 4/8/12/16/20/28/32/48 px, full 9999 px |
| Typografie | Roboto Flex, variable wght/wdth, M3 Display/Headline/Title/Body/Label, Emphasized |
| Elevation | Tonale Surface-Stufen; sparsame Popover-Schatten |
| Spatial fast/default/slow | Dämpfung/Steifigkeit .6/800, .8/380, .8/200; 350/410/570 ms |
| Effects fast/default/slow | 1/3800, 1/1600, 1/800; 140/210/300 ms |

## Animationsinventar / Zielzustände

- [x] 1. Start/Tageswechsel: 16 px Hochgleiten, Scale .96 → 1 + separater Fade; Staffelung 25 ms, Deckel 250 ms.
- [x] 2. Theme: Thumb-Feder/Stretch/Shape, Icon-Rotation, kreisförmiger Reveal, Effects-Fallback.
- [x] 3. Buttons: State-Layer, Ripple vom Berührungspunkt, .97 Press und Pill → lg; Toggle Form/Farbe.
- [x] 4. Connected Group: gemeinsamer Indikator, federnde Breite/Position, betonte Auswahl.
- [x] 5. Liste: keyed Karten/Gruppen, Shared-Element/FLIP, Enter und Exit.
- [x] 6. Karten: tonaler Hover/Press, Scroll, Wash/Bounce statt Schatten-Pulse.
- [x] 7. Erledigt: SVG-Häkchen, Form/Farbe, wachsende Titellinie, Badge-Crossfade, Statistik-Feder.
- [x] 8. Countdown: stabile maskierte Ziffernreels, 600-ms-Hero-Start, imminent Effects.
- [x] 9. Fortschritt: Clip-Path Spatial-Slow, gemeinsame Wavy Track/Phase, 0/100 % gerade.
- [x] 10. Zeitstrahl: gestaffelte Punkte, Rail-Wachstum, Heute-Bounce, Tooltip Enter/Exit, Ping-Ring, Band-Reveal.
- [x] 11. Kalender: Grid-Kollaps, gerichteter Monatswechsel/Titel, Tages-Morph, Grid-Details/Staffelung, Wochenbänder, Anker-Popover Enter/Exit.
- [x] 12. Hero/Leerzustand: Container-Transform und Fade-Through bei geändertem nächsten Termin.

## Verifikation

Syntax, Daten-/Zeitstrahlregression, Motion-Kanäle, Unterbrechungen, schnelle
Eingaben und live Reduced Motion. Browsermatrix: 360/768/1280/1600 px,
Hell/Dunkel/System, Tastatur, emuliertes Reduced Motion; Chromium/Firefox/WebKit
wenn verfügbar. 4× CPU-Trace und echte 60 fps getrennt von automatisierten Checks.

## Referenzen

- https://m3.material.io/styles/motion/overview/how-it-works
- https://m3.material.io/styles/color/roles
- https://m3.material.io/styles/typography/overview
- https://m3.material.io/components/progress-indicators/overview
- https://developer.android.com/reference/kotlin/androidx/compose/material3/MotionScheme
- https://android.googlesource.com/platform/frameworks/support/+/78cedbe4307a7eb2dd5ab988a0babc327548d1b3/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt

Web-Nachbildung, keine pixelgenaue Android-17-Implementierung. Kurven/Dauern aus
dem Auftrag sind zeitbasierte Approximationen, keine physikalischen Integratoren.
Semantische Typfarben und die vorhandenen Zeitraumfarben bleiben erhalten.

## Abschlussstatus

Alle zwölf Gruppen sind im Code umgesetzt; die Häkchen oben beziehen sich auf die
Implementierung. Node-Regressionen für Motion, Zeitstrahl, Fortschrittsgeometrie, Status und Resttage bestehen. Syntax, HTML-Struktur/IDs,
Daten-Unverändertheit und Whitespace geprüft. Siehe README für Animationstabelle
und bewusste Abweichungen.

- [x] Motion-/Zeitstrahl-/Farbrollen-Regressionen (Node, Europe/Berlin)
- [x] Keine neuen Laufzeit-Abhängigkeiten oder Build-Schritte
- [ ] Browser-Testmatrix 360/768/1280/1600 px, Hell/Dunkel/System
- [ ] Vollständige Tastatur-/ARIA- und visuelle Kontrastprüfung
- [ ] Echte Browser-Emulation von Reduced Motion und fehlenden Features
- [ ] 4× CPU-Trace und 60-fps-Nachweis auf Mittelklasse-Hardware

Browser-Binaries fehlen; die lokale Cloud-Browser-Vorschau ist mit
`ERR_BLOCKED_BY_CLIENT` blockiert. `tests/regression.html` steht zur lokalen
Ausführung bereit, wurde hier aber nicht ausgeführt. Daher Entwurfs-PR.



## Visuelle Testmatrix (PR B)

- [x] 102 Testfälle definiert und geladen: Chromium/Firefox/WebKit;
  360/768/1280/1600 px; Hell/Dunkel/System; kleine Reduced-Motion-Variante.
- [x] Eigener Playwright-Dev-Paketbereich, Python-HTTP-Server und festes Datum;
  Komponenten-/Statusbilder und reale DOM-Werte 0/3/50/76/97/100 %;
  eingefrorene Wellenphasen 0/600/1300 ms.
- [x] Node-Einstieg `node --test tests/` unabhängig von Playwright (16 Tests).
- [ ] Ausführung im offiziellen gepinnten Docker-Image und geprüfte,
  eingecheckte Baselines.
- [ ] Nachweis, dass die Tests ursprüngliche Fehler vor PR A erkennen.

Die Browsermatrix ist vorbereitet, **nicht abgeschlossen**. Docker fehlt und
Chromium startet mangels Binary nicht. Es wurde kein visueller Erfolg behauptet.
Ausführung, Baseline-Update und Gegenprobe: [visual-tests.md](visual-tests.md).
Ein CI-Workflow benötigt erst die Freigabe des Nutzers.


## Layout-Optimierung 2026 – Phase 1

- [x] Gemeinsames Tooltip-Overlay außerhalb des Scrollers; Escape, Hover/Fokus,
  erster/zweiter Touch, Scale/Opacity und Viewport-Klemmung.
- [x] Reservierung nur nach tatsächlichen Zeitraum-Label-Zeilen; Heute näher an
  der Schiene, Past-Füllung 85 % Typfarbe (rechnerischer Kontrasttest).
- [x] Begrenzte isotone Punktverteilung, 32 px Abstand, 22 px Hitflächen-Rand;
  unveränderte Prüfungsachse und 4-%-Datumsspanne.
- [x] Hero ohne Mindesthöhe/Stretch/Auto-Lücke, inset statt Sichel-Rand.
- [x] Ein Grid mit maximal vier Spalten; gemischte Zeilenüberschriften lösen
  den Konflikt zwischen vollbreiten Überschriften und Auffüllen ohne Lücken.
- [x] Kompakte Karten, Trailing-Checkbox, Countdown rechts, Wochen ab 14 Tagen.
- [x] Statistiksegmente mit Zählwert-Feder und kleinem Wellenbalken.
- [x] 20 Node-Tests, Daten-Fingerprint, Syntax und Whitespace.
- [ ] Visuelle Höhenziele, 360/768/1280/1600/2300 px in Hell/Dunkel/System,
  Tastatur/Touch und Reduced Motion im Browser; Vorher-/Nachher-Screenshots.

Nicht visuell verifiziert: fehlende Browser-Binaries, Download HTTP 403.
Die Browser-Testfälle wurden angepasst, nicht ausgeführt.

## Layout-Optimierung – Phase 2

- [x] Ab 1280 px: standardmäßig offene sticky Kalender-Seitenspalte 380–440 px.
- [x] Button, Breakpoint-Standard und explizite Sitzungswahl; Vollbreite darunter.
- [x] Kompakte 80-px-Zellen mit Terminlabel im 44-px-Tages-Button;
  alle Termine über Tagesdetails und vorhandenes Popover erreichbar.
- [x] Container Queries und Spalten-Observer statt überbreiter Desktop-Grids.
- [x] Fokus bei Schließen/Breitenwechsel schützen; Karten behalten ihre IDs/Knoten.
- [x] 20 Node-Regressionen, ES-Modul-Syntax und Whitespace.
- [ ] Browserfälle für Seitenspalte, sticky, Toggle, Fokus/Knotenerhalt,
  Tagesdetails und Popover ausführen; zuerst Phase 1 visuell stabilisieren.

Vorbereitet auf dem getesteten Phase-1-Stand, nicht zur Integration freigegeben.
Nicht visuell verifiziert; keine Pixel-/Browser-Stabilität behauptet.

## Layout-Optimierung – Phase 3

- [x] Theme vor CSS mit try/catch, unveränderter `theme_pref`-Schlüssel,
  Media-Metadaten für helle/dunkle Theme-Farbe.
- [x] Keine Ruhe-Rotation nicht gewählter Icons; Wechsel mit Spatial-Feder.
- [x] Transform-Wellenphase auf Track-/Fill-Pseudo-Elementen,
  gemeinsame Phase und statische 0/100 % / Reduced Motion.
- [x] Vier CSS-Layer, 26 unbedingte Komponentenselektoren konsolidiert,
  unbenutzte Tokens nach Quellensuche und tote Checkbox-Pseudo-Regeln entfernt.
- [x] Generiertes CSS-Inventar entfernt/ignoriert, dynamischer Bericht bleibt.
- [x] 22 Node-Tests, 3 Scanner-Tests, Syntax und Whitespace.
- [ ] Roboto Flex als variable WOFF2 + OFL lokal einbinden; Google-Fonts-Links
  bleiben bis zum erfolgreichen Download erhalten (HTTP 403 / Binär-Lesegrenze).
- [ ] Visuelle Kaskaden-/Wellen-/Theme-Prüfung, Vorher-/Nachher-Screenshots,
  Browsermatrix und Performance-Trace.

Kein Selbsthosting- oder Compositor-Nachweis behauptet. Optionaler Modul-Umbau
und generierte Gitarrentermine ausgelassen; fachliche Daten bleiben unverändert.
