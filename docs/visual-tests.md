# Browser- und visuelle Regressionen

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
