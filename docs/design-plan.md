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

