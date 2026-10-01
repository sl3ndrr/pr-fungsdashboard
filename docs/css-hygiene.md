# PR C – CSS-Hygiene und Gleichheitsprüfung

Ausgangsstand ist der gemergte PR B, Commit
`5810e5a06681225084c482a6ad3cb68005e023a2`. README (Designsystem & Motion),
Design-Plan und die in PR A notierten toten Deklarationen wurden berücksichtigt.

Das Skript `scripts/css-duplicates.mjs` erfasst einzelne Selektoren auch in
Selektorlisten sowie ihre Media-/Supports-/Starting-Style-Kontexte. Es findet in B
108 wiederholte Selektoren mit 275 Fundstellen, nach dem Cleanup 99 mit 248.
Das vollständige, automatisch erzeugte Inventar klassifiziert jede Fundstelle:
[css-duplicate-inventory.md](css-duplicate-inventory.md). Dort stehen auch pro
Selektor die entfernten Properties und Gewinnerzeilen aus B.

Vollständig überschriebene Regeln/Deklarationen entfallen. Teilregeln werden nur
zusammengeführt, wenn die dazwischenliegende Kaskade unverändert bleibt. Zehn
Selektoren sind konsolidiert: `.page-header`, `.hero-number`, `.stats-container`,
`.card`, `.mini-progress`, `.mini-progress span`, `.countdown`,
`.timeline-period-label`, `.timeline-dot::before` und `.cal-day-details`.

Die Zielstellen entsprechen B-Zeilen 400, 453, 409, 265, 550, 551, 483, 427,
567 und 580. Bei `.card` bleibt die Basis vor dem mobilen Padding; eine Verlagerung
nach 461 würde dieses Padding überschreiben. Der Header bleibt vor dem mobilen
Gap. Die spezifischeren Textstatus-/Zeitraum-/Done-Regeln behalten Vorrang.
Beim Hero steht der Font-Shorthand vor den weiter wirksamen Größe-/Variations-
Deklarationen. Bei Details steht der Border-Shorthand vor `border-width: 0`.
Die zwischenliegenden Regeln schreiben ansonsten keine verschobene Property mit
gleicher oder geringerer Spezifität auf denselben Elementen.

Bewusst getrennt bleiben Basisregeln mit mobilen Overrides (`.hero`, `.cal-day`),
geteilte Control-/Button-/Typografieregeln, spezifische Hover/Focus/Status-Regeln,
alle bedingten Fallbacks und Reduced Motion. Die Font-/Background-Shorthands
werden nicht pauschal entfernt: einzelne spätere Longhands ersetzen nicht deren
gesamtes Ergebnis. Die seit Fix 4b nicht mehr gerenderten Datumticks/-labels
entfallen ebenfalls.

HTML, Anwendungs-JS, Daten, Tokens, Motion-Werte und die Testfälle aus PR B werden
nicht geändert. Es gibt keine neuen Abhängigkeiten. Die Anwendung bleibt ohne
Build. Die README-Beschreibung von Design und Verhalten gilt weiterhin.

## Inventar reproduzieren

Vom Repo-Root, nach Checkout des C-Branches:

```bash
git show 5810e5a06681225084c482a6ad3cb68005e023a2:css/styles.css > /tmp/pr-b-styles.css
node scripts/css-duplicates.mjs /tmp/pr-b-styles.css > /tmp/css-duplicates-before.json
node scripts/css-duplicates.mjs css/styles.css > /tmp/css-duplicates-after.json
node scripts/css-hygiene-report.mjs /tmp/pr-b-styles.css > /tmp/css-duplicate-inventory.md
node --test scripts/css-duplicates.test.mjs
TZ=Europe/Berlin node --test tests/
```

Der Klassifikationsbericht ist auf diesen B-Stand und die geprüften Zielstellen
bezogen; das reine Inventarskript funktioniert auch auf dem aktuellen CSS.

## Browser-Nachweis

`tests/visual/compare-css.mjs` liest das Original-CSS als Pflichtargument. Es
liefert beide Versionen in frischen Browserkontexten per Route-Override aus; HTML,
JS, Datum, Daten-Fixtures, Schrift-Fallback und Browser sind identisch. Es nutzt
die bestehenden Helfer aus B. Für jedes DOM-Element (auch versteckte Elemente)
werden sämtliche von `getComputedStyle` aufgelisteten Properties einschließlich
Custom Properties verglichen, zusätzlich `::before`, `::after` und `::marker`.
Es gibt keine Property-Ausnahmeliste.

Chromium/Firefox/WebKit prüfen alle B-Zustände: Viewports 360/768/1280/1600,
Hell/Dunkel/System samt dunklem OS, Statuskarten, Hero-Tagesvarianten,
Fokus/Escape/Touch, Filter und Resize. Reduced Motion wird zusätzlich bei allen
Breiten/Themes und den Wellenzuständen geprüft. Echte Balken erhalten
0/3/50/76/97/100 %; Animationen werden bei 0/600/1300 ms pausiert.

Die Komponenten- und Ganzseitenbilder verwenden dieselben Regionen wie B.
PNG-Bytes müssen identisch sein; es gibt keine Farb-/Pixel-Toleranz. Abweichungen
liefern beide PNGs bzw. einen JSON-Property-Diff. `report.json` nennt CSS-Hashes,
Zustands-/Bildanzahl und Browser. **Erfolg verlangt `complete: true`, alle drei
Browser und `differences: []` sowie Exitcode 0.** Ein Startfehler liefert
`complete: false`, einen Fehlertext und Exitcode 1; eine dann leere Differenzliste
ist kein Gleichheitsnachweis.

Im gepinnten offiziellen Image aus dem Repo-Root:

```bash
git show 5810e5a06681225084c482a6ad3cb68005e023a2:css/styles.css > tests/visual/test-results-before.css
docker run --rm --ipc=host -v "$PWD:/work" -w /work/tests/visual \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -lc 'npm ci --ignore-scripts && node compare-css.mjs test-results-before.css'
rm tests/visual/test-results-before.css
```

Zusätzlich müssen die unveränderten B-Screenshot-Tests gegen geprüfte B-PNGs
bestehen. Diese PNGs waren in B noch nicht eingecheckt. Sie zuerst **auf dem
B-Stand** im selben Image mit `npm run update` erzeugen, prüfen und anschließend
auf C mit `npm test` vergleichen (siehe [visual-tests.md](visual-tests.md)).
Baselines dürfen nicht erst aus dem bereinigten C-CSS erzeugt werden.

## Tatsächlich ausgeführte Prüfung

- 16/16 bestehende Node-Checks sowie 3/3 Scanner-Checks bestanden.
- Syntax der neuen Skripte und `git diff --check` bestanden.
- Statischer Vergleich der letzten bedingungslosen Einzelselektor-/Property-Werte
  bestätigt die gleichen Werte, außer den dokumentierten obsoleten Regeln,
  redundanten Tooltip-Display-Werten und den durch transparent `!important`
  überschriebenen Fill-Backgrounds. Dieser Vergleich beweist keine Browserkaskade.
- Der echte Vergleichsaufruf startet den Python-Server, scheitert aber am fehlenden
  Chromium-Binary vor dem ersten Seitenaufruf: **0 geprüfte Browserzustände**.
  Der Browser-Download wurde mit HTTP 403 (`Forbidden. Calls to this URL are not
  allowed.`) blockiert. Docker ist nicht installiert.

**Offen:** pixelgleiche B-Screenshots und tatsächlich leere Computed-Style-Diffs
in allen drei Browsern. PR C bleibt ein Entwurf und ist noch nicht visuell
abgenommen. Kein CI-Workflow wird angelegt.
