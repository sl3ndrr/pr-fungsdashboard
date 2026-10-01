# Visuelle Regressionen (PR B)

Playwright ist ausschließlich eine Entwicklungsabhängigkeit. Das Dashboard
bleibt statisch, frameworkfrei und ohne Build-Schritt oder Runtime-Pakete.

```bash
npm ci --ignore-scripts
npx playwright install --with-deps chromium firefox webkit
npm test
npm run test:visual:update
npm run test:visual
```

Der erste Screenshotlauf erzeugt lokale Referenzen; diese sind vor Verwendung
visuell zu prüfen. Ein Vergleich ohne Referenzen schlägt fehl und erstellt
keine stillschweigend akzeptierten Baselines. `test:visual:update` ist deshalb
eine bewusste Review-Aktion. Screenshots und Reports sind nicht eingecheckt.

Der CI-Workflow für PRs verwendet den **Basis-Commit als Referenz-App**:
derselbe Testcode, Browserstand, Linux-Systemfont, Datum und In-Memory-Browser-
Kontext erzeugen zuerst die Basis-Screenshots und vergleichen dann den Head.
Das vermeidet erfundene oder hier ungeprüfte Referenzbilder. Erwartete visuelle
Änderungen führen zu einem Diff, der vor dem Merge bewertet werden muss.
CI greift nicht auf Produkt-LocalStorage zu. `DASHBOARD_ROOT` legt nur fest,
welcher Checkout vom lokalen Testserver ausgeliefert wird.

Der vollständige Lauf erzeugt bei Fehlern Trace, Actual/Expected/Diff sowie
HTML-Report. Ein manueller Workflow-Lauf erzeugt ein Review-Set ohne Vergleich.
Die CI-Artefakte sind 14 Tage verfügbar. PR C kann seine unveränderte Darstellung
damit gegen B prüfen. Die Workflow-Datei muss für weitere PRs mit übernommen werden.

## Matrix und gezielte Prüfungen

- Chromium, Firefox, WebKit; 360/768/1280/1600 px; Hell/Dunkel/System und echte
  Media-Emulation für `prefers-reduced-motion` (System emuliert eine helle Präferenz).
- Vollseiten-Screenshots, keine horizontale Seitenüberschreitung, transparente
  Zeitraum-Labels innerhalb der Achse, neutrale Status-Chips und `aria-valuetext`.
- Abgebrochen mit/ohne Grund, Erledigt, Abgelaufen, Heute und Zahlen-Countdown;
  zusätzliche Termine ausschließlich über eine abgefangene Fixture-Antwort.
- Hero bei 1/12 Tagen und Heute; Tastaturaktivierung der echten Danach-Buttons,
  Zielkartenfokus, Tooltip-Fokus/Escape, zwei Touch-Aktivierungen, Label-Kollisionen
  und Erhalt einer selbst gesetzten Scrollposition bei Filter/Resize.
- Reale Hero-/Statistik-Balken bei 0/3/50/25-von-33/97/100 Prozent,
  `document.getAnimations()` pausiert und `currentTime` exakt 0/600/1300 ms.
  Beide Pseudo-Layer müssen dieselbe Transformation und 24×12-px-Maske haben;
  die Füllung darf keine Skalierung haben. Screenshots in 400 % CSS-Zoom.

CSS-Zoom ist ein reproduzierbarer Vergrößerungsnachweis der Geometrie, keine
automatisierte Prüfung des Browser-Menü-Zooms. Die echte 400-%-Browser-Zoom-
Abnahme, Fonts mit Roboto Flex, reales Touch-Hardware-Verhalten, vollständige
Tastaturfolge und Performance-Trace bleiben manuell erforderlich.

## Status dieser Lieferung

Die Testdefinitionen wurden geladen und aufgelistet, Node-Tests und Syntax geprüft.
Browser-Ausführung und Screenshots konnten hier mangels Binaries nicht erfolgen.
Es gibt keine als geprüft dargestellten Referenzbilder. Die Paketversion ist
auf den verfügbaren Playwright-Runtime-Stand gepinnt; Registry-Download und
Browser-Installation bleiben für CI/den lokalen Browser-Test offen.
