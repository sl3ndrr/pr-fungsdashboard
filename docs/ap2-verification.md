# AP2: Komponentenabnahme

Stand: 12.11.2026. Basis: `main` = `7be186a`. AP1-Voraussetzung am Code von `main`
erneut geprüft: aufgeteiltes `app.js`, gemeinsame Datumsquelle `clock.js` vorhanden.
Produktänderungen betreffen ausschließlich AP2-Komponenten und die zugehörigen Texte.
Sommerdaten, Terminlogik, Zeitstrahl und Raster bleiben unverändert.

## Änderungen und Entscheidungen

- **A1:** Im einzigen 44px breiten Trailing-Slot zeigt die Checkbox Häkchen-Umriss und
  „Offen“ bzw. „Erledigt“. Das tatsächliche Eingabeziel ist 44×56px. Im erledigten Zustand
  bleibt die rechteckige Form erhalten, damit das Label vollständig auf der Kontrastfläche liegt.
- **A2:** `is-complete` statt Positionsselektor; 0/0, 0/2 und 1/2 bleiben neutral,
  2/2 wird grün. Die Fortschrittsfarbe steht in derselben CSS-Schicht wie ihr Standard;
  der Browsertest prüft die berechnete Farbe, nicht nur die Klasse.
- **A3:** Der Hero wird bewusst nicht auf die Höhe der Nebenspalte gestreckt. Bei 840px
  am 11.11.: vorher 509,69px, nachher 377,38px; Nebenspalte weiterhin 509,69px.
  Der Wochentag stammt aus dem nächsten Termin. Die alte Gleichhöhen-Assertion wurde
  wegen dieser beabsichtigten Verhaltensänderung durch eine Prüfung der natürlichen Höhe ersetzt.
- **A4:** Ein gefüllter Danach-Chip ohne zweiten kreisförmigen Hintergrund.
- **A7/A8:** Kachel „Einträge“, persönlicher Typfilter „Sonstiges“, passende Leertexte und
  ARIA-Gruppenname sowie sichtbare Erklärung „A = 1. Termin · B = Wiederholung“.
  Browsertests prüfen die Texte und Leerzustände in allen fünf AP2-Breiten und beiden Themes.
- **A11, Rot:** Unverändert nach Sichtung beider Themes, insbesondere 15./18.12. und
  16./17.02. Der Typ bleibt über beschriftetes Badge und Symbol erkennbar; Dringlichkeit
  über Countdown und große tonale Fläche. Ein neuer Rotton würde eine zusätzliche
  semantische Farbe einführen, ohne den Status zuverlässiger zu erklären. Die ursprünglichen
  main-Aufnahmen vom 15.12. und die Endaufnahmen wurden verglichen.
- **A11, Live-Region:** Fontdatei im Test tatsächlich verzögert geladen und DOM-Mutationen
  beobachtet. In der Font-/Zahlenanimationsphase entstehen Mutationen; nach Abschluss
  der Animation im gemessenen Filter- und Resize-Durchlauf keine. Der Hero hat keine
  pauschale `aria-live`-Region mehr, sodass seine Layout-/Animationsmutationen keine
  Live-Meldung auslösen. Dies ist ein DOM-Nachweis, kein behaupteter Screenreader-Hörtest.

## Tatsächliche Prüfungen

Chromium 151 / Playwright 1.62.1 auf Windows; Locale de-DE, Zeitzone Europe/Berlin.
Python-Testserver auf 8000, Playwright-Testserver auf 8765. Keine neuen Abhängigkeiten.

- `TZ=Europe/Berlin node --test tests/`: **73 bestanden, 0 fehlgeschlagen**,
  einschließlich Sommer-Fingerprint und A/B-Grenzfällen.
- `node --test scripts/css-duplicates.test.mjs`: **3 bestanden, 0 fehlgeschlagen**.
- `components.spec.mjs`: **236 bestanden**, keine übersprungenen Fälle.
  Die 224 Grundfälle kombinieren 320×640, 375×812, 600×900, 840×900, 1200×900,
  1600×1000, 2300×1200 mit Hell/Dunkel, normaler/reduzierter Bewegung und allen Tagen:
  11.11., 15.12., 18.12.2026, 16.02., 17.02., 18.02., 01.03., 08.04.2027.
  Zehn weitere Fälle prüfen in beiden Themes bei 320/375/840/1200/2300px erledigte Abgaben,
  0/2–2/2, Abbruch und Leertexte. Zwei Fälle prüfen Font-Load und Navigation.
- **286 Zustandsmessungen:** kein horizontaler Überlauf, keine interaktiven Ziele unter
  44×44px, keine erfassten Zeitstrahl-Labelüberschneidungen. Geänderte Texte sowie offene,
  erledigte und abgebrochene Zustände erreichen WCAG AA; niedrigster gemessener Textkontrast
  **6,37:1**. Konsolenfehler/-warnungen werden in allen AP2-Fällen als Fehler behandelt.
- Abgabe und Reload, Bestanden und Reload samt Rücknahme, Typfilter und Zurücksetzen durch
  Navigation, vergangene Termine, Zeitstrahlmodus, Tooltip per Hover/Fokus/Escape,
  Punkt-/Danach-Navigation mit Kartenfokus geprüft.
- `keyboard-check.mjs`: **14 Kombinationen, 308 Tab-Stopps**, vollständiger Zyklus mit
  sichtbarem Fokus; Pfeiltasten/Home/End, explizites Theme gegen Systempräferenz und
  lebender Wechsel der Systempräferenz geprüft.

Vorher-/Nachher-Aufnahmen der fünf AP2-Breiten in beiden Themes sowie Endaufnahmen wurden
angesehen. Das Entfernen der Hero-Streckung, neutrale Fortschrittszustände, die beschriftete
Checkbox und die einfachen Danach-Chips sind visuell bestätigt. PNGs, Übersichtsblätter,
Rohmessungen und Testausgaben bleiben in `test-results/`; sie sind nicht eingecheckt.

## Vollständig ausgeführte Bestandssuite und Folgearbeit

Alle 169 vorhandenen Chromium-Fälle wurden mit unveränderten Assertions versucht
(`--workers 2 --retries 0 --update-snapshots=none --timeout 20000`):
**99 bestanden, 70 fehlgeschlagen, keine übersprungen**. Der Lauf wurde nicht abgebrochen.
Die einzige Verhaltensanpassung an einem bestehenden Test ist die oben erklärte Herohöhe.
Die 70 Fehlschläge bestehen aus:

| Anzahl | Befund |
| --- | --- |
| 50 | Nicht vorhandene Screenshot-Referenzen; keine automatisch erzeugt oder akzeptiert |
| 10 | `.expired`-Selektor trifft Terminzeile und Countdown, Strict-Mode-Fehler |
| 9 | Linearitätsprüfung misst Mitte des Label-Hit-Ziels statt eigentlichem Datumspunkt |
| 1 | Gleichdatumsprüfung vergleicht mit nicht vorhandener Koordinate (`undefined`) |

Je ein Vertreter der drei technischen Fehlerklassen wurde gegen das unveränderte `main`
auf einem separaten Testserver wiederholt: dieselben Fehler, bei der Skalenprüfung derselbe
Wert 1,381510416666666 statt <0,02. Diese Bestandsfehler sind kein Grund, AP2-Assertions
abzuschwächen oder die Zeitstrahllogik in diesem Paket zu verändern. Die Bestandssuite ist
ausdrücklich **nicht grün**; Referenzen und Testselektoren sind separat zu bearbeiten.

Firefox und WebKit wurden bewusst nicht ausgeführt; die vollständige AP2-Abnahme erfolgte
in Chromium. Ein realer Screenreader-Hörtest und physische Mobilgeräte wurden nicht verwendet.
Die bestehende Chromium-Suite enthält echte emulierte Touch-Aktivierungen; diese bestanden.
