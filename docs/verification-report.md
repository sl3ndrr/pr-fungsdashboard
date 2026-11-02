# Abnahmebericht – A/B-Termine und Wintersemester

Stand: 02.11.2026. Basis `9278abb35b454ab0429d81ea4e81446782478db9`,
letzter Commit vom 24.10.2026. `git log -10` geprüft; keine neueren Änderungen.
Der GitHub-Snapshot wurde über die Verbindung gelesen; lokale Blob-/Tree-Hashes
stimmen mit dem Repository überein. Direkter Git-Transport ist hier HTTP-403-gesperrt.

## Ergebnis

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| Ausgang `TZ=Europe/Berlin node --test tests/` | 40 Tests, 40 pass, 0 fail |
| Nach Entfernung der alten Oberfläche | 37 Tests, 37 pass, 0 fail |
| Endstand Node | **58 Tests, 58 pass, 0 fail** |
| `node --test scripts/css-duplicates.test.mjs` | **3 Tests, 3 pass, 0 fail** |
| Sommerdaten | Vorhandener SHA-256-Fingerprint und korrigierte p7/g18-Assertions bestehen |
| Syntax | Alle App-Module und Visual-Specs mit `node --check` geprüft |
| CSS | 302 Regeln vom vorhandenen Scanner eingelesen; keine verwaisten Selektorfragmente |
| Whitespace | `git diff --check` bestanden |
| Browser-Discovery | 507 Fälle, sechs Spec-Dateien, drei Browserprojekte; kein Ausführungsnachweis |
| Ausgewählter Chromium-Fall | Vor Seitenaufruf fehlgeschlagen: Executable fehlt |
| Browserinstallation | Download von `cdn.playwright.dev` nach beschreibbarem Temp-Setup: HTTP 403 |
| System-Chrome | `channel:'chrome'`: `/opt/google/chrome/chrome` fehlt |
| Font-Self-Hosting | Abruf der Google-Fonts-Quelle HTTP 403; unverändert eingebunden |
| Screenshots/Baselines | Keine neuen PNGs, keine Baselines erzeugt/überschrieben |

## Fachliche und technische Abnahme

- Legacy-Datum/Zeit und genau ein A-Termin funktionieren mit derselben Zeilenstruktur.
- A vorbei/B offen bleibt aktuell; B sortiert und gruppiert die Karte, danach beide vergangen.
- Heute ist bis zum lokalen Tagesende aktuell; DST-Datumsmathematik bleibt erhalten.
- Undatierte Prüfungen bekommen keine Occurrence und keinen Countdown, bleiben in
  Datenreihenfolge hinter allen datierten Karten. `earliest` überschreibt `examsFrom`.
- B vor A, doppelte/falsche Keys, ungültiges Datum, leere Zeit, widersprüchliche
  date/sittings-Felder und leere Nicht-Prüfungen werden einzeln mit Warnungen verworfen.
- Hero/Danach flatten A/B mit eindeutigen Occurrence-IDs und gemeinsamer Event-ID zur Karte.
- Gesamtsumme zählt eine Prüfung einmal, Sieben-Tage-Zahl einzelne offene Termine.
- Abgehakte Prüfungen und Abgaben verlassen anstehende Übersicht und Sieben-Tage-Zahl.
- Bestanden-Undo bleibt nach B verfügbar; die gespeicherte ID ist die Event-ID.
- Volle Gruppen-ARIA-Namen enthalten Wochentag, Datum, ausgesprochene Zeit und Countdown;
  visuelle Zeileninhalte sind verborgen, damit Zahlen nicht doppelt vorgelesen werden.
- Motion-Test prüft B-Promotion per Spatial-Transform und Live Reduced Motion.
- Winter-Occurrences behalten bei neun geprüften Railbreiten disjunkte 44px-Ziele;
  dies sind reine Geometrieprüfungen mit Fixture-Textmaßen, keine Browsermessungen.

## Designbefunde

| Befund | Nachweis und Maßnahme | Grenze |
| --- | --- | --- |
| Titelspalte | 300−32 Padding−36 Icon−24 Gaps−90 Trailing =118px; neuer Kopf ohne Countdown liefert 220px | Umbruchzahl bei 320/360px nicht im Browser gemessen |
| Danach dreistellig | Alter fester Slot 4,5rem =72px; jetzt auto und nowrap | Geprüfte Quelländerung, vorbereitete DOM-Zeilenassertion |
| Dichte | Rail-Pitch 52→44px, Labelreserve 8→4px, Lane-Abstand 8→4px, B-Punkt 12→8px bei unverändertem Ziel | 200–220px Gesamtkartenhöhe nicht erreicht/nicht browserverifiziert |
| Farben | Fünf Farbtests für Hell/Dunkel bestehen; zusätzliche 16 neue Textrollenpaar-/Modus-Prüfungen mindestens **6,868:1** | Rechnerische sRGB-Kontraste, keine gerenderte Messung |
| Bedienfeedback | Reine Informationskarten ohne Hover-Translate/Pressed-Scale; Buttons behalten State-Layer | Echte Geräteprüfung offen |

### Reine Modellrechnung zur Dichte

Neun Winter-Occurrences, Datum 11.11.2026; angenommene Systemschrift mit 6,5px pro
Zeichen bei 12px Font. CSS-Containerbreiten rechnerisch abgeleitet. Diese Werte sind
Renderer-Ausgaben mit Mock-Canvas und **keine gemessenen DOM-Höhen**.

| Viewport | Railbreite | Vor engerem Lane-Pitch | Danach |
| --- | --- | --- | --- |
| 320 | 262,4 | 312 | 280 |
| 360 | 299,2 | 312 | 280 |
| 390 | 326,8 | 312 | 280 |
| 600 | 520 | 292 | 260 |
| 840 | 398,56 | 312 | 280 |
| 1200 | 598,2 | 292 | 260 |
| 1600 | 904 | 292 | 260 |
| 2300 | 1604 | 240 | 216 |

Das offene Prüfungsband fügt 24px hinzu; Header, Legende und Padding sind nicht in
den Railwerten enthalten. Vier nahe Termine benötigen eigene 44px-Ziele. Ein striktes
200–220px-Limit würde zusammengefasste Interaktionen oder eine andere Skala benötigen.
Kollisionsfreiheit und direkte Navigation haben hier Vorrang; das Höhenziel bleibt offen.

## Annahmen und Alternativen

- Prüfungsjahre 2027 aus Wintersemester 2026/27 abgeleitet; ASP-Portfolio 18.12.2026.
- `activeFrom` ist 11.11.2026 statt 01.12., direkt nach dem Sommertermin 10.11.
- Portfolio-Zeit lautet exakt „Uhrzeit offen“.
- `examsFrom: '2027-02-15'` ist eine Untergrenze. Ein offenes Band besitzt kein erfundenes Ende.
- Alle Karten wurden vereinheitlicht; eine gesonderte A/B-Kartenklasse wurde verworfen,
  damit Einzeltermine dieselbe Struktur und Zugänglichkeit nutzen.
- Der einzige Hierarchieentscheid sitzt in `cards.js:sittingRows()`; der reversible
  FLIP-Hook heißt `motion.js:syncSittingRows()`. Keine Font-Size-Transition.
- Semesterfenster zeigt auch abgeschlossene/abgebrochene Historie; „Ab heute“ verwendet
  offene, nicht abgebrochene Occurrences. Der hohle Punkt bleibt Abbrüchen vorbehalten.
- Vorhandene String-Marker-Tests wurden an explizite neue Funktionsgrenzen angepasst;
  alte Oberflächenfälle entfernt, fachliche Abdeckung durch neue Regressionen erweitert.

## Bewahrte Altdaten

`g1`, `g2`, `g3`, `g4`, `g5`, `g6`, `g7`, `g8`, `g9`, `g10`, `g11`, `g12`,
`g13`, `g14`, `g15`, `g16`, `g17`, `g18`: Gitarrenunterricht mit `calOnly:true`.
Diese 18 persönlichen Einträge sind nun verwaist und werden nicht angezeigt.
Sie wurden nicht gelöscht. Vorschlag: nach gesonderter Entscheidung aus den Daten entfernen.
`calendarDayDiff`, Datums-Icon, `PERIODS` und `periodsOnDay` bleiben im Einsatz.

## Tag und Veröffentlichung

`pre-calendar-removal` wurde lokal vor Änderungen auf die Basis-SHA gesetzt.
Die GitHub-Verbindung bietet keine Tag-Schreiboperation; der direkte Git-Push ist gesperrt.
Der Remote-Tag kann daher hier nicht veröffentlicht werden. Im regulären Checkout:

```bash
git tag pre-calendar-removal 9278abb35b454ab0429d81ea4e81446782478db9
git push origin refs/tags/pre-calendar-removal
```

Branch/Commit-Veröffentlichung und PR laufen über die verfügbaren GitHub-Operationen.
Der PR bleibt wegen fehlender Browser-Abnahme ein Entwurf.

## Vor Merge offen

320/360/390/600/840/1200/1600/2300px in Hell/Dunkel tatsächlich rendern, Screenshots
ansehen, Titel/Countdowns und Spalten messen. Systemmodus, Tastatur, Touch, Bestanden-
Persistenz/Undo, Tages-/Semesterwechsel, Screenreader und Live Reduced Motion im Browser
prüfen. Höhenziel sowie Performance bleiben ausdrücklich offen.
