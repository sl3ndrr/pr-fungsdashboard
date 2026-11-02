# Abnahmebericht – Zeitstrahl, Seitenlayout und M3 Expressive

Stand 24.10.2026. Ausgangsstand `main`: `97d3e68e2ba0054c25e64c25c4ad5a350eec1c43`.
Implementierung in drei aufeinanderfolgenden Commits A/B/C. **Browser-Abnahme offen;
der PR ist deshalb ein Entwurf.** Dieser Bericht trennt ausgeführte Node-/Quellprüfungen
von lediglich vorbereiteten Browserprüfungen.

## Änderungen je Phase

## Messbare Abnahmekriterien 1–11

Die exhaustive Breitenprüfung ist eine Prüfung der reinen Geometriefunktion, **keine**
Messung von 1.981 Browserfenstern. Gleiches gilt für die rechnerischen Kontrastwerte.

## Höhen Vorher/Nachher (Referenzdatum 24.10.2026)

Die Ausgangsangaben des Auftrags enthalten Spannweiten, keine zu jeder einzelnen
Breite gehörenden Messwerte. Sie wurden hier nicht nachgemessen. „Offen“ bedeutet
nicht gemessen und ist kein geschätzter Nachherwert.

| Breite | Zeitstrahl vorher (Einzelwert) | Zeitstrahl nachher | Hero vorher (Einzelwert) | Hero nachher |
| --- | --- | --- | --- | --- |
| 320 px | nicht übermittelt | offen | nicht übermittelt | offen |
| 360 px | nicht übermittelt¹ | offen | nicht übermittelt¹ | offen |
| 390 px | nicht übermittelt¹ | offen | nicht übermittelt¹ | offen |
| 600 px | nicht übermittelt | offen | nicht übermittelt | offen |
| 820 px | nicht übermittelt¹ | offen | nicht übermittelt¹ | offen |
| 1024 px | nicht übermittelt | offen | nicht übermittelt | offen |
| 1280 px | nicht übermittelt¹ | offen | nicht übermittelt¹ | offen |
| 1600 px | nicht übermittelt¹ | offen | nicht übermittelt¹ | offen |
| 2300 px | nicht übermittelt¹ | offen | nicht übermittelt¹ | offen |

¹ Für diese Breiten nennt der Auftrag zusammen 326–342 px Zeitstrahl und
261–267 px Hero; zusätzlich beschreibt er Compact-Heros mit 308–487 px.
Es wird bewusst kein Einzelwert aus diesen Bereichen erfunden.

Die Fit-Spec schreibt `measurements.json`, die Layout-Spec `overview-heights.json`.
`capture.mjs before|after` erzeugt pro Stand acht PNGs (360/820/1280/2300 × Hell/Dunkel)
und Höhen-JSON. Vorher muss auf dem Basisstand, Nachher auf dem PR-Stand aufgenommen
und jedes Bild angesehen werden; Anleitung: [visual-tests.md](visual-tests.md).

## Entscheidungen und Abweichungen

## Ausgeführte Befehle und Ergebnisse

```text
Ausgang: TZ=Europe/Berlin node --test tests/
  tests 44; pass 44; fail 0
Nach A: tests 38; pass 38; fail 0
Nach B: tests 38; pass 38; fail 0
Nach C: tests 40; pass 40; fail 0; cancelled/skipped/todo 0
node --test scripts/css-duplicates.test.mjs
  tests 3; pass 3; fail 0
playwright test --list
  Total: 372 tests in 5 files
Chromium pro Phase, je ein ausgewählter Test:
  1 failed (Launch), browserType.launch: Executable doesn't exist
  .../chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
```

Zusätzlich: Syntaxprüfung aller App-Module und Visual-Specs, CSS-Scanner-Parsing,
HTML-Struktur/IDs und `git diff --check`. Der statische Python-Server lieferte HTTP 200;
das bestätigt nur die Auslieferung, keine ausgeführte Anwendung.

Browseralternativen: Chromium-Installation vom offiziellen Playwright-CDN scheitert
mit HTTP 403. Cloud-Browser auf localhost erreicht eine andere, authentisierungspflichtige
Oberfläche statt der App. Die anschließend versuchte eingebettete `data:`-Vorschau
wurde von der URL-Richtlinie abgewiesen und nicht weiter umgangen. Kein echter
App-Browserlauf oder Performance-Trace konnte dadurch durchgeführt werden.

## Vor Merge offen

Alle neun Breiten, drei Datumszustände, Hell/Dunkel sowie System/Reduced Motion
wirklich rendern; Screenshots ansehen; Höhen und DOM-Boxen messen; Touch, Fokus,
Tageswechsel und lange Titel abnehmen; erst danach akzeptierte Baselines einchecken.
Insbesondere die Kartenhöhe 200–220 px und die engen Caption-Zeilen bleiben
visuelle Risiken, die hier mangels Browser nicht aufgelöst werden konnten.
