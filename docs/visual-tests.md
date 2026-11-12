# Browser- und visuelle Regressionen

AP5: [Semesterwahl und Archivabnahme](ap5-verification.md). Die neuen Fälle laufen
mit `npx playwright test archive.spec.mjs --project chromium --update-snapshots=none`
im bestehenden Testpaket. Sie hängen Messungen und Bilder an, ohne Bildreferenzen
anzulegen. Für das Winter-Gate wird aus dem Repo-Root explizit aufgenommen:

```bash
node tests/visual/archive-check.mjs --record --root /pfad/zum/unveraenderten-main --out test-results/ap5/recording
node tests/visual/archive-check.mjs --out test-results/ap5/current
```

Die Referenzen liegen in `test-results/ap5/winter-baseline`; `--baseline` kann den
Pfad ändern. Aufnahme überschreibt keine vorhandenen Referenzdateien. Verglichen
werden vollständige Übersicht/Terminliste und die Übersichtposition, mit dem
bestehenden Playwright-Maßstab; Rohpixelzahlen werden separat ausgegeben.
`--viewport`, `--heute`, `--theme` begrenzen einen Diagnosefall, `--smoke` vier
mobile/Desktop-Startansichten. Der Helper startet den vorhandenen Node-Server auf
8016 selbst, ohne Python oder neue Abhängigkeiten.

Die App bleibt ohne Build und Laufzeitpakete. Playwright 1.62.1 ist ausschließlich
Testwerkzeug; Node-Regressionen benötigen keine Pakete.

```bash
TZ=Europe/Berlin node --test tests/
node --test scripts/css-duplicates.test.mjs
cd tests/visual
npm ci --ignore-scripts
npx playwright install chromium firefox webkit
npm test -- --list
npm test -- --project chromium --grep 'A/B'
```

Die Konfiguration startet einen Python-Webserver auf 8765, Locale de-DE und
Zeitzone Europe/Berlin. `openDashboard()` setzt Datum und Theme, fängt Google Fonts
für reproduzierbare Systemschrift ab und lässt Animationstimer weiterlaufen.

## Aktuelle Matrix

`sittings.spec.mjs`: 320/360/390/600/840/1200/1600/2300px × Hell/Dunkel ×
11.11.2026, 23.02.2027 und 08.04.2027. Dazu Tageswechsel A→B mit Knotenidentität,
Bestanden/Undo, Fokus und B-Tooltip/Navigation. Jede Matrixprüfung hängt
`ab-measurements.json` und einen vollständigen Screenshot an. Die Ausgaben gehören
zu den Testartefakten, nicht automatisch zu akzeptierten Baselines.

Gemessen werden horizontaler Overflow, Hero-/Zeitstrahlhöhe, 44px-Ziele,
Zielüberlappung, Danach-Zeilenumbrüche, Spalten, eindeutige IDs und Gruppen-ARIA.
Die weiteren Specs prüfen Sommerdaten, lineare Skala, Fenster, Tooltip, Themes,
Fokus, Layout und Wellen. Der explizit leere Winterfall injiziert eine leere Fixture;
die echten Winterdaten sind seit dieser Änderung befüllt.

## Screenshots und Baselines

Auf dem Ausgangsstand sind keine PNG-Baselines eingecheckt. Die bestehenden strengen
`toHaveScreenshot`-Fälle benötigen nach dem ersten tatsächlichen Lauf angesehene
Referenzen. Keine Baseline blind erzeugen oder aktualisieren. `sittings.spec.mjs`
erzeugt unabhängig davon Review-Screenshots als Anhänge.

Für Vorher-/Nachher-Vergleiche mit dem vorhandenen Werkzeug:

```bash
node capture.mjs before
# identische Browser-/Font-/Datumsbedingungen, Server auf Zielstand umstellen
node capture.mjs after
```

Ausgabe: `test-results/review-before/` bzw. `review-after/`, jeweils PNGs und
`measurements.json`; optional `DASHBOARD_URL`. Jedes Bild vor der Abnahme ansehen.
`compare-css.mjs` bleibt für reine Kaskadenvergleiche verfügbar; die neue
Kartenstruktur kann keine Pixelgleichheit mit der vorherigen Darstellung besitzen.

## Tatsächlicher Stand am 02.11.2026

**507 Fälle in sechs Dateien erkannt** (169 je Chromium/Firefox/WebKit).
Ein ausgewählter Chromium-A/B-Fall scheitert vor dem Seitenaufruf an fehlender Binary.
Installation in beschreibbarem Temp-/Browserverzeichnis versucht: Download HTTP 403.
`channel:'chrome'` versucht: `/opt/google/chrome/chrome` nicht vorhanden.

**0 gerenderte Browserfälle, 0 neue Screenshots, keine DOM-Höhen, Touch-, visuellen
Kontrast- oder Performance-Nachweise.** Der PR bleibt bis zur Browser-Abnahme Draft.
Details: [verification-report.md](verification-report.md).

# Visuelle Prüfungen

AP2-Komponentenmatrix und Sonderzustände ohne Bildreferenzen:

```bash
cd tests/visual
npx playwright test components.spec.mjs --project chromium --workers 2 --update-snapshots=none
```

Die 236 Fälle prüfen sieben Viewports, acht Stichtage, beide Themes und normale/reduzierte
Bewegung sowie Checkboxzustände, Teilfortschritt, Abbruch, Leertexte, Font-Load und
Navigation. PNGs und JSON-Messungen liegen ausschließlich im ignorierten Laufordner.
`component-audit.mjs` prüft echte Bounding-Boxes und Textkontrast einschließlich
transparenter Hintergründe und der Checkboxoberfläche. Ergebnisse und Grenzen:
[AP2-Abnahme](ap2-verification.md).

Im Projektverzeichnis `python3 -m http.server 8000` starten, anschließend `cd tests/visual && npm ci`. `node ux-check.mjs --heute 2027-02-18 --viewport 375x812 --theme dark --reduced-motion --selector .simulation-notice` erzeugt einen Vollseiten-Screenshot und JSON unter `test-results/ux/`. `--selector` kann für Kontrastmessungen wiederholt werden; transparente und halbtransparente Hintergründe sind manuell nachzuprüfen. `--out PFAD` wählt einen anderen Ausgabeordner, `--all` führt die gesamte Matrix aus. `DASHBOARD_URL` überschreibt die Serveradresse. Die Ergebnisse sind keine automatisch akzeptierten Baselines.

Die vorhandenen Specs laufen mit `npx playwright test`; Browser müssen zuvor mit `npx playwright install` installiert werden. Auf Systemen ohne `python3` kann `PYTHON` den Pfad zum Python-Interpreter festlegen.
