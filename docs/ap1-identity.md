# AP1: Identität und Renderaufwand

Die Referenz stammt von `main` = `9af0cbe24289b8216374c2c8578ddd8f7ed4f4d2`,
vor Änderungen am Anwendungscode. PNGs, HTML und Messprotokolle bleiben unter
`test-results/identity/` ignoriert. Referenzen werden nicht eingecheckt.

## Gate ausführen

Nach `cd tests/visual && npm ci --ignore-scripts` im Repository-Stamm:

```sh
node tests/visual/identity-check.mjs --record --serve --out test-results/identity/record-controlled
node tests/visual/identity-check.mjs --serve --out test-results/identity/repeat-controlled
# Nach jedem Schritt: erneut vergleichen, mit eigenem --out, ohne --record.
```

`DASHBOARD_URL` setzt die Serveradresse (Standard `http://127.0.0.1:8011`).
`--serve` startet einen lokalen Node-HTTP-Server im selben Prozess. Das ist der
Fallback, falls Python fehlt. `PLAYWRIGHT_BROWSERS_PATH` kann auf vorhandenes
Firefox zeigen. Der Nachweis verwendet Firefox 153.0, DPR 1, de-DE und
Europe/Berlin; `--browser chromium` bleibt für andere Umgebungen verfügbar.
`--smoke` verwendet eine separate, explizit anzugebende Baseline.
Das Gate installiert weder Browser noch Abhängigkeiten und akzeptiert keine
Referenzänderungen im Vergleichsmodus.

`route.fetch` wiederholt ausschließlich zurückgesetzte HTTP-Verbindungen maximal
dreimal. Nach einer Verbindungsunterbrechung kann `--resume-log <gesicherte Logdatei>`
mit demselben `--out` erfolgreiche Fälle fortsetzen. Dafür müssen Quell-SHA-256,
Browser und Aufnahmeprotokoll exakt zum gespeicherten Manifest passen. Nur im Log
nach allen Assertions vollständig abgeschlossene Fälle werden übernommen; sämtliche
gespeicherten HTML-/Fokus-/Geometrie- und PNG-Dateien werden erneut gegen die
Originalreferenz geprüft. Alle übrigen Fälle laufen erneut im Browser. Für den
ersten unterbrochenen Selbstvergleich wurde das Manifest nachträglich unter
Prüfung von unverändertem `HEAD` und sauberem Anwendungs-Diff eingerichtet.
Für die ebenfalls unterbrochene Performance-Stufe wurden die unveränderten
eingefrorenen Quellen geprüft (alle Dateiänderungszeiten vor Laufbeginn).
Spätere Läufe speichern das Manifest automatisch vor ihrer ersten Aufnahme.

## Normalisierung

Nach `fonts.ready` und zwei Animation Frames wird jeder Zielknoten geklont.
Nur vorübergehende Nachfahren mit
`.motion-decoration` oder `.motion-exit` werden entfernt. Leere `style=""`-
Attribute werden entfernt: Playwrights Caret-Unterdrückung hinterlässt sie
abhängig vom zuvor fokussierten Input; sie enthalten keine Deklaration.
Die ausschließlich zur Ripple-Position verwendeten Pointer-Koordinaten `--x`
und `--y` werden entfernt. Vollseitenaufnahmen können zusätzliche ResizeObserver-
Renders auslösen, die diese kurzlebigen Koordinaten unabhängig vom sichtbaren
Zustand wieder entfernen. Alle anderen Inline-Deklarationen bleiben erhalten.
Die Kalibrierung erfolgt vor Änderungen am Anwendungscode. Verwendet wird
`baseline-controlled`; vorherige Kalibrierungsaufnahmen bleiben separat erhalten.
Das Gate nutzt die originale Zwei-Bild-Stabilisierung von Playwrights
`toHaveScreenshot` (in der festgelegten Version über `_expectScreenshot`), mit
`animations: 'disabled'`, `caret: 'hide'`, CSS-Pixelskalierung und 10 s Timeout.
Es verändert weder das Stylesheet noch die Animations-API der Anwendung.
Der Komparator erhält bis zu acht stabilisierte Aufnahmen zum Abgleich;
Schwelle und erlaubte Diffpixel bleiben dabei unverändert.
Nach Reload wird vor der nächsten Aktion ebenfalls auf Fonts und Frames
gewartet; die Browser-History-Scrollwiederherstellung ist für diese isolierten
Testkontexte deaktiviert, und Reload startet bei Scrollposition 0. Damit wird
Persistenz unabhängig von Font-bedingter nativer Scroll-Verankerung geprüft.
Der anwendungseigene Fokus-/Scroll-Erhalt bei Renders bleibt unverändert aktiv.
Attribute werden nach Namen sortiert, CRLF wird zu LF. Text, Leerzeichen,
Klassen, sonstige Attribute, Zahlen, übrige Inline-Styles, IDs, ARIA,
Reihenfolge und Knotenstruktur bleiben vollständig
erhalten. Insbesondere werden keine Geometrie- oder Stilabweichungen gerundet
oder ausgeblendet. Das Ergebnis ist das normalisierte `outerHTML`.

Pflichtziele: `#hero`, `#timeline-container`, `#timeline-legend-items`,
`#stats-line`, `#list`. Zusätzlich: Tooltip und alle betroffenen Steuerelemente.
Auch aktives Element und gemessene Geometriebefunde werden exakt verglichen.
Vor Aufnahmen wird der Ausschnitt explizit gesetzt: Seitenanfang/-ende,
Listenanfang oder betroffene Karte beziehungsweise Zeitstrahl bei 80 px Abstand
zum oberen Viewportrand. Tooltip-Aufnahmen behalten den Ausschnitt der vorherigen
Zeitstrahlaktion, da Scrollen den echten Tooltip schließt; sein offener Zustand
wird zusätzlich geprüft. Außer bei offenem Tooltip wird der Mauszeiger vor der
Aufnahme auf (0,0) gesetzt und Escape gedrückt. So löst die unter den Zeiger
scrollende Seite keinen zufälligen Hover-Tooltip aus. Diese Testaktionen verhindern die bereits auf `main`
beobachteten 1-px-Schwankungen des nativen Fokus-Scrollens. Absolute Offsets werden
zusätzlich protokolliert. Die bestehenden Browserfälle prüfen den anwendungseigenen
Fokus-/Scroll-Erhalt, und beide zuständigen Funktionskörper bleiben nachweislich
unverändert. PNGs werden mit dem originalen Playwright-Komparator und den
vorhandenen Optionen `maxDiffPixels: 0, threshold: 0.1` verglichen. Die Freigabe
dieser Methode wurde im Chat ausdrücklich erteilt: Der Rohpixel-Selbstvergleich
schwankte bereits auf unverändertem `main` trotz identischem HTML, Geometrie und
berechneten Styles. **0 Playwright-Diffpixel bedeutet deshalb nicht 0 abweichende
RGBA-Pixel.** `rawPixels` wird zusätzlich als Diagnose protokolliert.

Es werden keine Bildbereiche maskiert und keine Referenzen im Vergleichsmodus
überschrieben. Verglichen wird der gesamte jeweilige Viewport. Zusätzlich zum
Initialzustand wird der untere Seitenbereich aufgenommen; Interaktionen zeigen
weitere Bereiche einschließlich Zeitstrahl, Karten und offenem Tooltip.
Vollseitenaufnahmen hatten in dieser Umgebung zusätzliche Renderbewegungen
ausgelöst und werden deshalb nicht als Pixelreferenz verwendet. Das vollständige
HTML aller Zielknoten bleibt auch außerhalb des Viewports Bestandteil des Gates.

## Matrix und Interaktionen

Viewports: 320×640, 375×812, 600×900, 840×900, 1200×900, 1600×1000, 2300×1200.
`?heute=`: 2026-11-11, 2026-12-15, 2026-12-18, 2027-02-16, 2027-02-17,
2027-02-18, 2027-03-01 und 2027-04-08. Reduced Motion ist überall an.
Explizit hell/dunkel jeweils mit Initialzustand, Resize und Interaktionen:
Vergangene, Abgabe per Space und Reload/Undo, Bestanden einschließlich Reload/Undo
(wo verfügbar), alle vier Typfilter, Semesterfenster, Tooltip Hover/Fokus/Escape,
Zeitstrahl- und Danach-Navigation mit Kartenfokus, Theme-Pfeiltaste.
Systemmodus mit beiden emulierten Farbschemata: Initialzustand, Seitenende, Resize und
Theme-Pfeiltaste. Zusätzlich Sommer mit Perioden am 01.10.2026 bei 1200×900 in
beiden Themes. Insgesamt 226 Szenarien; nicht verfügbare Aktionen werden
explizit anhand der vorhandenen Bedienelemente übersprungen.

Jeder Checkpoint misst Konsolenfehler/-warnungen, horizontalen Overflow,
sichtbare interaktive Ziele unter 44×44 px und überlappende Zeitstrahl-Labels.
Renderaufrufe werden ausschließlich durch Test-Routing am Einstieg `render`
gezählt; Canvas-Erzeugung über `document.createElement`. Produktionscode erhält
keine Mess-Hooks. Resize wechselt einmal auf 1200 px (von 1200 auf 1600 px),
damit sowohl Railbreite als auch Listenspalten betroffen sind.

Komplette Tab-Navigation und Kontrastmessungen laufen ergänzend; die bestehende
Farbprüfung testet unveränderte Rollenpaare in beiden Paletten. Chromium liefert
ergänzende Funktions-, Tastatur-, Kontrast- und Renderprüfungen. WebKit wurde
nicht geprüft. Browserübergreifende Pixelgleichheit wird nicht behauptet.

Die drei Refactor-Stufen werden als eingefrorene Quellstände jeweils vollständig
gegen dieselbe Originalreferenz geprüft. Vor dem zugehörigen Commit werden die
geprüften Dateien bytegleich übernommen und ihre SHA-256-Werte protokolliert;
dadurch sind auch parallel ausgeführte Prüfungen eindeutig dem jeweiligen
Commit-Inhalt zugeordnet. Referenzaufnahmen und Selbstvergleich laufen auf dem
unveränderten Ausgangsstand.

## Ergebnisse

| Quellstand | Szenarien | Checkpoints | Normalisiertes HTML | Playwright-Diffpixel |
| --- | ---: | ---: | --- | ---: |
| Unverändertes `main`, Selbstvergleich | 226 | 2.344 | identisch | 0 |
| Schritt 1: Module und expliziter Zustand | 226 | 2.344 | identisch | 0 |
| Schritt 2: RAF-Bündelung und Messcanvas | 226 | 2.344 | identisch | 0 |

Referenz: `record-controlled`; Selbstvergleich: `repeat-controlled`.
Nach lokalem Verbindungsabbruch wurden 156 vollständig abgeschlossene Fälle
erneut aus ihren gespeicherten Aufnahmen validiert und 70 im Browser geprüft.
Alle Konsolen-, Overflow-, Zielgrößen- und Labelprüfungen bestehen.
Vor dem Einrichtungscommit: 58/58 Node-Tests und 3/3 CSS-Scanner-Tests bestanden.

Schritt 1: vollständiger Browserlauf `structure-complete`, danach 41 Quelldateien
bytegleich übernommen und per SHA-256 manifestiert. Mobile Tooltip- und Desktop-
Abhaken-Aufnahmen manuell verglichen: keine Abweichung. Im Checkout: 63/63
Node-Tests und 3/3 Scanner-Tests bestanden; `app.js` hat 53 Zeilen.

Schritt 2: `rendering-controlled`, nach Verbindungsabbruch 187 abgeschlossene
Browserfälle erneut vollständig aus ihren Aufnahmen validiert und 39 im Browser
geprüft. 43 Quelldateien bytegleich übernommen und manifestiert; 68/68 Node-Tests
und 3/3 Scanner-Tests bestanden. Die fünf zusätzlichen Tests prüfen RAF-Bündelung,
abwartbare Renderergebnisse, Fehlerbehandlung und Canvas-/Schrift-Wiederverwendung.
