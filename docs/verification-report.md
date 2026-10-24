# Abnahmebericht – Zeitstrahl, Seitenlayout und M3 Expressive

Stand 24.10.2026. Ausgangsstand `main`: `97d3e68e2ba0054c25e64c25c4ad5a350eec1c43`.
Implementierung in drei aufeinanderfolgenden Commits A/B/C. **Browser-Abnahme offen;
der PR ist deshalb ein Entwurf.** Dieser Bericht trennt ausgeführte Node-/Quellprüfungen
von lediglich vorbereiteten Browserprüfungen.

## Änderungen je Phase

| Phase | Änderung | Tatsächlich ausgeführt |
| --- | --- | --- |
| A | Eingepasste lineare Kalendertagsskala; Ab-heute-/Semesterfenster; beschriftete abwechselnde Lanes; native 44px-Buttons mit sofortiger Navigation; tonale, geclippte Zeiträume; Monatsjahre/Heute-Layer; kompakte Legende; Scroll-Code entfernt | 38/38 Node, 3/3 Scanner; Playwright erfasst Fälle, ein Chromium-Fall scheitert am Executable |
| B | Ab 840 px Hero links und Zeitstrahl/Statistik rechts; gleich hohe Spalten per Grid-Stretch; Statistik füllt drei gleiche Spalten; kompakter Hero; deutsche Trennung; M3-Breakpoints | 38/38 Node, 3/3 Scanner; Chromium-Fall scheitert vor dem Seitenaufruf |
| C | Gemeinsame Connected Groups inkl. Theme; rahmenlose Dringlichkeit; normale Label-Schreibweise; dekorative Rahmen entfernt; Shape-/Typografie-/Farbrollen; zusätzliche Kontrasttests, Dokumentation und Capture-Werkzeug | 40/40 Node, 3/3 Scanner; Chromium-Fall scheitert vor dem Seitenaufruf |

`js/data.js` wird im GitHub-Diff nicht verändert. Keine fachlichen Daten, IDs oder
Datenformate geändert. `motion.js`, Storage, Kalenderfunktion, Typfilter und Tageswechsel
bleiben erhalten. Keine neuen App-Pakete oder Build-Werkzeuge.

## Messbare Abnahmekriterien 1–11

| Nr. | Ist-Wert / Nachweis | Grenze / offener Nachweis |
| --- | --- | --- |
| 1 | Node prüft 1.981 ganzzahlige Geometriebreiten von 320 bis 2300 px: je zwei kommende Punkte, insgesamt 3.962 Positionen im zulässigen Bereich; t2 und p7 vorhanden | Keine DOM-Messung von `scrollWidth/clientWidth`; neun Breiten in Hell/Dunkel vorbereitet |
| 2 | Geometrieprüfung bei zwölf Containerbreiten 200/256/280/320/360/390/600/820/1024/1280/1600/2300: Semesterpunkte und ihre Label-/Zielintervalle je Reihe disjunkt. Gleichdatierte Fixture sowie 23./24.09. und 05./07.10. explizit geprüft | Automatisierte Browser-Bounding-Box-Prüfung vorhanden, nicht gelaufen |
| 3 | Render-Unit-Test: 2/2 kommende Punkte mit direktem Label; bei Platzmangel Datum-only. Geometrietest: Labelzentrum exakt beim Datum, Abweichung nur bei Rand-Clamping | Kein gemessener Browserwert für die 8px-Toleranz; Canvas-Messung und tatsächliche Schrift im Browser offen |
| 4 | Quellstand: Pille z=9, Linie z=2; eigene 24px-Zeile, Linie endet vor den Zeitraum-Bändern; Rand-Clamping | Keine visuelle oder Hit-Test-Verifikation der Textfreistellung |
| 5 | Punkt und Label teilen einen nativen Click-Handler zu `selectTimelineEvent`; Touch-Zwei-Schritt entfernt | Zwei echte Touch-Kontexte für Punkt/Label vorbereitet; 0 erfolgreich ausgeführt |
| 6 | Nutzerbefund: Zeitstrahl 326–342 px, Hero 261–267 px als Referenzbereich; Compact-Hero laut Auftrag bis 487 px | **0 eigene Vorher-/Nachher-Höhen**, keine Bilder. Höhenziel 200–220 px nicht bestätigt; Tabelle unten |
| 7 | DOM-Struktur: Hero und rechte Gesamtspalte sind Geschwister; rechts drei gleich breite Statistikspalten. HTML-Prüfung: 29 eindeutige IDs | ±1px-Spaltenhöhe und Leerraumfreiheit nur als Browser-Assertions vorbereitet |
| 8 | Hero-/Karten-/Danach-Titel verwenden `overflow-wrap:break-word; hyphens:auto`; `lang=de` vorhanden. 390/1280px-Systemschriftfälle vorhanden | **Keine tatsächliche Wortumbruchprüfung**; Trennwörterbuch/Font-Fallback müssen im Browser geprüft werden |
| 9 | `TZ=Europe/Berlin node --test tests/`: **40 Tests, 40 pass, 0 fail**. Ausgang 44; alte Scroll-/Entzerrungstests ersetzt. Fenster, linearer Maßstab, Lanes/Labels, 0/1 Termine, Reihenfolge, Abbruchgrenze, calOnly/hideFromNext, DST enthalten | Kein Browserersatz aus Node ableiten |
| 10 | **372 Playwright-Fälle in 5 Spec-Dateien** werden erkannt (124 je Browserprojekt). Verweise auf entfernte Zeitstrahl-Selektoren aus Anwendung und Tests entfernt. Capture-Script für acht Vorher-/Nachher-Ansichten ergänzt | 3 ausgewählte Chromium-Fälle (je Phase einer) beim Launch fehlgeschlagen; 0 App-Seiten gerendert. Keine Baselines erzeugt/aktualisiert/angesehen |
| 11 | **5 Farbtestfälle** in Hell/Dunkel grün; Minimum der 38 geprüften Text-Rollenpaare **5,214:1**, verbleibende Kalender-Outline mindestens **3,811:1**. **5 Motion-Unit-Tests** inkl. Live Reduced Motion grün | Kein gerenderter Kontrast-, Reduced-Motion-, Überschwinger-, Screenreader- oder Performance-Nachweis |

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

- Kalender-Seitenspalte von 1280 auf **1200 px (Large)** migriert; Sticky-Verhalten,
  Breite 380–440 px und explizite Öffnen-/Schließen-Wahl bleiben. Listen behalten
  die intrinsischen Container-Queries 660/1000/1300 px.
- Fenster: zwei Kalendertage Rand plus 22px-Hitflächenrand. „Ab heute“ hat bei
  fehlenden kommenden Terminen mindestens fünf Tage nach heute, damit die Skala
  nicht degeneriert. „Semester“ berücksichtigt alle Haupttermine inkl. Abbruch.
- Heute außerhalb des Semesterfensters wird am nächsten Rand geklemmt; das Fenster
  wird dafür nicht über die Semestertermine hinaus erweitert.
- Bei dichtem Semesterverlauf hat Überlappungsfreiheit Vorrang vor Kartenhöhe.
  Kurze Zeitraum-Bänder behalten ihre Breite; vollständige Texte stehen bei Bedarf
  in der unmittelbar folgenden Zeile. Das weicht von einem strikt seitlichen
  Fallback ab und verhindert abgeschnittene oder überdeckte Labels.
- Label Medium verwendet im Zeitstrahl ausnahmsweise zwei dichte 12px-Zeilen,
  damit Text und Punkt in einem 44px-Button bleiben. Sonstige Rollen bleiben normal.
- Nullradien an offenen Enden fortlaufender Kalenderbänder und weißer SVG-Masken-
  Alpha sind technische Ausnahmen; keine zusätzlichen UI-Farb-/Shape-Systeme.
- Die für Abnahme nötige Browserprüfung wurde **nicht** durch erfundene Screenshots,
  hochgezählte Test-Discovery oder Quellcode-Inspektion ersetzt. PR bleibt Draft.

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
