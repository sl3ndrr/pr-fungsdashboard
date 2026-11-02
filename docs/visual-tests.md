# Browser- und visuelle Regressionen

Die App bleibt ohne Build und Laufzeitpakete. Playwright 1.62.1 liegt ausschließlich
in `tests/visual/` als Dev-Werkzeug. Node-Regressionen benötigen es nicht.

## Start

```bash
TZ=Europe/Berlin node --test tests/
node --test scripts/css-duplicates.test.mjs
cd tests/visual
npm ci --ignore-scripts
npx playwright install chromium firefox webkit
npm test
```

`playwright.config.mjs` startet den statischen Python-Server auf 8765 und setzt
Zeitzone Europe/Berlin und Locale de-DE. Zum reinen Erkennen der Fälle:

```bash
npm test -- --list
npm test -- --project chromium
```

## Matrix und Messung

`openDashboard` friert das Datum mit `page.clock.setFixedTime` ein; Animationstimer
laufen weiter. Google Fonts wird abgefangen, damit System-Fallback reproduzierbar
geprüft wird. Keine echten Daten werden geändert: Randfälle injizieren Fixtures
nur in abgefangene Modulantworten.

Die Fit-Fälle hängen `measurements.json` an (Hero-/Zeitstrahlhöhe, Punkte, Labels,
Pille/Linie und Scrollgrößen). Die Layoutfälle liefern `overview-heights.json`.
Bei 360/820/1280/2300 px werden zusätzlich Nachher-Vollseitenbilder für Hell/Dunkel
in den Testausgaben geschrieben. Vorher-Bilder müssen auf dem unveränderten
Basisstand mit denselben Daten/Fonts/Breiten aufgenommen werden; siehe Capture-Script.

## Vorher-/Nachher-Aufnahme

Das Capture-Script funktioniert auf beiden Ständen, da es nur gemeinsame IDs nutzt.
Zuerst den gewünschten Stand mit `python3 -m http.server 8000` starten, dann:

```bash
cd tests/visual
node capture.mjs before
# Server auf neuen Stand wechseln; identische Browserinstallation weiterverwenden
node capture.mjs after
```

Optional `DASHBOARD_URL` für eine andere Serveradresse. Ausgabe ist
`tests/visual/test-results/review-before/` bzw. `review-after/`, jeweils acht PNGs
und `measurements.json`. Bilder tatsächlich ansehen, erst dann Tabellen ausfüllen.
Das Script ist ein Aufnahme-Werkzeug; es erklärt keine Baseline für akzeptiert.

## Baselines

Bestehende `toHaveScreenshot`-Aufrufe bleiben bewusst streng. Auf dem Basisstand
waren keine PNG-Baselines eingecheckt. In dieser Arbeit wurden keine erzeugt oder
aktualisiert, weil der Browser nicht startet. Ein erster erfolgreicher Lauf benötigt
angesehene und freigegebene Baselines. Niemals ein blindes Update als Nachweis behandeln.

```bash
npm run update
# Alle erzeugten PNGs ansehen, Diff und Mess-JSON prüfen; dann gezielt einchecken.
```

`compare-css.mjs` bleibt für einen kontrollierten Kaskadenvergleich verfügbar;
die funktionalen Layoutänderungen dieses Auftrags sind keine Pixel-Gleichheit zum
Basisstand. Referenzen auf den entfernten Zeitstrahl-Scroller sind bereinigt.

## Tatsächlicher Ausführungsstand dieser Arbeit

372 Fälle in fünf Spec-Dateien werden erkannt. Je Phase ein Chromium-Startversuch,
alle drei scheitern am fehlenden Executable vor dem Laden der App. Download von
`cdn.playwright.dev`: HTTP 403. Auch Cloud-Browser-Zugriff auf den lokalen Server
und eingebettete data-URL-Vorschau waren blockiert. **Null erfolgreich gerenderte
Browserfälle, null neue Screenshots, null visuelle/Höhen-/Performance-Nachweise.**
Die Details und alle Abnahmekriterien stehen in [verification-report.md](verification-report.md).
