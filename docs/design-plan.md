# Design- und Umsetzungsstand

Stand: 02.11.2026. Basis `main` = `9278abb35b454ab0429d81ea4e81446782478db9`
vom 24.10.2026; `git log -10` enthält keine neueren Änderungen.

## Umsetzung

- [x] Liste über volle Breite, Header rechts nur Theme; 1–4 Spalten mit Container-/Viewport-Fallback.
- [x] Legacy-Termine und A/B-Termine gemeinsam normalisiert; Einzel-Occurrences für Übersicht.
- [x] Zehn Winter-Events: neun Prüfungen, fünf ohne Datum, acht Prüfungstermine, ein Portfolio.
- [x] Umschaltung 11.11.2026; Mindestdatum undatierter Prüfungen 15.02.2027.
- [x] Kartenkopf über volle Breite, Abgabe-Checkbox als einziger Trailing-Slot.
- [x] Einheitliche Terminzeilen: 64/48px, 28/24px Buchstaben-Chips, 12px Innenradius.
- [x] Nächste Zeile groß, B nach A automatisch groß; vergangenes A kompakt.
- [x] `sittingRows()` in `cards.js` bündelt diese Hierarchie; `syncSittingRows()` in
  `motion.js` animiert die Änderung per Spatial-Transform-FLIP. Beide Stellen sind separat rückbaubar.
- [x] Je Terminzeile ein vollständiger Gruppenname, visuelle Ziffern verborgen.
- [x] Hero-Badge A/B, zweite Terminzeile, Danach-Chips und eigene Occurrence-Keys.
- [x] Zeitstrahl B kleiner/gefüllt, hohle Punkte nur für Abbruch; Kurznamen aus Daten.
- [x] Bestanden-Auswahl nach A; Rücknahme nach B bleibt möglich, gespeicherte IDs bleiben Event-IDs.
- [x] Prüfungsgesamtzahl ohne A/B-Doppelzählung, offene Prüfungen gesondert.
- [x] Offenes Prüfungsband mit Verlauf und „Ende offen“ im Namen, ohne Enddatum.
- [x] Danach-Abstände intrinsisch, nicht umbrechend; Lane-Pitch 44 statt 52px.
- [x] Keine Hover-/Pressed-Klickbewegung auf informativen Karten (eigener P3-Commit).
- [ ] Roboto Flex selbst hosten: Quelldownload HTTP 403; bestehende Einbindung erhalten.

## Befunde und begründete Grenzen

1. **Titelbreite bestätigt, rechnerisch:** Bei 300px Karte vorher 300−32−36−24−90
   =118px. Neuer Kopf ohne Countdown-Trailing bietet 300−32−36−12 =220px.
   Abgaben behalten den 44px-Checkbox-Slot. Tatsächliche Umbruchzahl bleibt ungemessen.
2. **Danach-Risiko bestätigt, Code:** 4,5rem waren 72px. Jetzt `flex:0 0 auto` und
   `white-space:nowrap`. Für 320/360px sind Browser-Assertions vorbereitet; kein Messwert behauptet.
3. **Dichte bestätigt, Modellrechnung:** Mit neun Winter-Occurrences bei simuliertem
   12px-Systemfont (6,5px/Zeichen, keine Browsermessung) ergibt der alte Renderer
   312px Rail bei 320px Viewport, jetzt 280px. Bei 2300px 240→216px.
   Das offene Prüfungsband benötigt zusätzlich 24px; Header/Padding/Legende kommen hinzu.
   Das Ziel 200–220px für die gesamte Zeitstrahlkarte ist bei engem Fenster nicht erreicht.
   Vier nahe Termine brauchen getrennte 44px-Ziele. Wir erhalten die lineare Skala,
   direkte Einzeltermin-Navigation und Kollisionsfreiheit statt Ziele zu überdecken.
   Ein zusammengefasster Cluster-Button wäre eine weitergehende Produktänderung.
4. **Browser-Abnahme versucht, blockiert:** Chromium-Download HTTP 403, System-Chrome fehlt,
   ausgewählter Playwright-Fall scheitert vor dem Seitenaufruf. Keine Screenshots/DOM-Messwerte.

## Entscheidungen

- Monat des nächsten Termins bestimmt die aktuelle Kartengruppe; vollständig vergangene
  Karten stehen unter „Vergangen“, undatierte am Ende unter „Termin noch offen“.
- Das Semesterfenster behält erledigte/abgebrochene Historie. „Ab heute“ und Hero/Danach
  verwenden offene, nicht abgebrochene Termine. So bleibt der Abbruchstatus überprüfbar.
- Gleichdatierte A/B-Termine sind zulässig; B vor A wird verworfen.
- „Uhrzeit offen“ ist eine echte Datenangabe und wird nicht durch eine Uhrzeit ersetzt.
- `examsFrom`/`earliest` sind Untergrenzen, keine erfundenen Einzeltermine.
- Bestehende Sommerdaten einschließlich aller 18 `calOnly`-Einträge bleiben erhalten.
- Keine Frameworks, Builds oder neuen Laufzeitpakete; keine Baseline-Dateien geändert.

## Abnahme

58/58 Node, 3/3 Scanner. 507 Browserfälle in sechs Dateien erkannt, **0 erfolgreich ausgeführt**.
Hell/Dunkel/System, reale Touch-/Fokusbedienung, Screenreader, tatsächlicher Umbruch,
Tageswechsel im Browser, Reduced Motion und Performance bleiben vor Merge zu prüfen.
