# AP5: Semesterwahl und Archiv

Ausgangs-`main`: `c555700`. AP1 ist durch Module, Store und RAF-Scheduler im Code
vorhanden; AP2 durch Komponentenpolitur, neutrale Abgabenfarben und natürliche
Hero-Höhe. Die entsprechenden Commits sind Vorfahren des Ausgangsstands.
Branch: `ap5/semester-archiv`.

## Verhalten und Entscheidungen

- Die native Auswahl liegt über der bestehenden Semesterzeile. Der sichtbare
  Semestername und der Pfeil bilden gemeinsam das mindestens 44px hohe Ziel.
  Die Headerhöhe und die Position der Winterinhalte bleiben erhalten. Es gibt
  keine eigene Popup-/Tastaturimplementierung und keinen Semester-Speicherschlüssel.
- Nur eine exakte ID aus `SEMESTERS` überschreibt die Datumsautomatik. Der
  `semester`-Parameter wird mit `history.replaceState` gesetzt; bestehende
  Parameter, Hash und History-State bleiben bestehen. Nach dem Rendern erhält
  der Wechsler den Fokus. Ein neuer Kontext ohne Parameter startet automatisch.
- Ein Abschluss setzt für jedes nicht-`calOnly`-Event einen vergangenen letzten
  Kalendertag voraus. A allein reicht bei vorhandenem B nicht. Der letzte Tag
  bleibt bis 23:59:59 offen; auch abgebrochene Events zählen für die Zeitspanne.
  Leere Semester und Semester mit undatierten Prüfungen werden nicht als
  abgeschlossen ausgegeben. Insbesondere bleibt der Winter am 08.04.2027 wegen
  seiner fünf undatierten Prüfungen offen.
- Im Archiv starten Vergangenheit und Semesterfenster sichtbar; der Nutzer kann
  beide weiterhin umschalten. Der Heute-Marker bleibt außerhalb der tatsächlichen
  Terminspanne verborgen, auch innerhalb der zwei grafischen Randtage.
- Der Rückblick zählt alle Prüfungs-Events einschließlich Abbrüchen, bestandene
  nicht abgebrochene Prüfungen nur anhand gespeicherter IDs, nicht abgebrochene
  Abgaben erledigt/gesamt und alle Abbrüche separat. Der Sommer ergibt frisch
  **7 Prüfungen, 0 als bestanden markiert, 2/2 Abgaben, 1 Abbruch**. Keine Noten
  oder Ergebnisse werden aus dem Datum abgeleitet.
- Vorhandene Häkchen bleiben bedienbar. Ein sichtbarer Archivhinweis und das
  README erklären den gemeinsamen Speicher. `isDone` wird über alle Semester
  vorbelegt, nur ohne vorhandenen Speicherstand; `[]` wird unverändert respektiert.
  Die bestehende Behandlung nicht lesbaren Speichers bleibt erhalten: Anfangswerte
  im Arbeitsspeicher, kein Überschreiben des nicht lesbaren Eintrags.
- `js/list.js`, `js/cards.js`, `js/data.js`, `tests/semester.test.mjs` und `.github/`
  sind unverändert; keine neuen Abhängigkeiten. Die Sommer-Fingerprint-Prüfung besteht.

## Browser und sichtbare Iterationen

Playwright **1.62.1**, Chromium **151.0.7922.34**, Windows, de-DE,
Europe/Berlin, DPR 1. Python3 war ein nicht ausführbarer Windows-Store-Verweis.
Port 8000 war belegt; der vorhandene Node-HTTP-Server wurde zunächst auf 8015,
für gemeinsame Server-/Browser-Prozesse auf 8016–8018 verwendet. Im Sandbox-Netz
waren lokale Sockets gesperrt; die tatsächlichen Browserläufe verwendeten den
freigegebenen Prozesskontext. Der erste Chromium-Start suchte im Sandbox-Profil;
der Downloadversuch dort scheiterte an DNS. Mit Netzwerkzugriff war der Browser
im realen Benutzerprofil erreichbar. Die festgeschriebene Version wurde explizit
gestartet; ein vorheriger `npx`-Versuch lud zusätzlich eine neuere Binary, die
für diese Abnahme nicht verwendet wurde. Paketdateien bleiben unverändert.

Vor der ersten Produktänderung wurden 375×812 hell und 1200×900 dunkel aufgenommen
und angesehen. Nach der Seeding-Korrektur sind beide PNG-Dateien bytegleich.
Vor dem Wechsler wurden zusätzlich 112 Winterzustände als unveränderliche lokale
Referenzen aufgenommen. Nach dem UI-Einbau wurden Winter und Archiv erneut
aufgenommen und angesehen. Dabei wurde der Heute-Marker aus dem grafischen
Randabstand entfernt; die korrigierte Ansicht wurde nochmals aufgenommen.
Abschlussbilder des Archivs wurden repräsentativ für alle sieben Breiten sowie
beide Paletten angesehen. PNGs, Messungen und Berichte liegen ausschließlich im
ignorierten `test-results/ap5/`.

## AP5-Matrix und Messwerte

`archive.spec.mjs`: **159 bestanden, 0 fehlgeschlagen, 0 übersprungen, 0 flaky**.
Das sind **271 gemessene Zustände**, **201 Screenshots** und **322 Tabstopps mit
sichtbarem Fokus**. Gemessen: **0 Browser-Konsolenfehler/-warnungen, 0 horizontale
Überläufe, 0 Ziele unter 44×44px, 0 erfasste Zeitstrahl-Labelüberschneidungen**.
Auch der Wechsler überlappt keine anderen interaktiven Elemente. Niedrigster
gemessener Textkontrast der AP5-Flächen: **7,69:1**.

| Dimension | Geprüft |
| --- | --- |
| Viewports | 320×640, 375×812, 600×900, 840×900, 1200×900, 1600×1000, 2300×1200 |
| Tage | 11.11., 15.12., 18.12.2026; 16.02., 17.02., 18.02., 01.03., 08.04.2027; zusätzlich 10.11.2026 an der Semestergrenze |
| Archiv | Sommerparameter an allen acht Matrixtagen, Hell/Dunkel gegen entgegengesetzte Systempräferenz, Reduced Motion |
| Grenze | Ohne Parameter am 10./11.11.; ungültige ID; beide expliziten Semester am 10.11. |
| System | Beide Semester bei allen Breiten, emuliertes Dunkel und lebender Wechsel zu Hell |
| Bewegung | Archivwechsel und Interaktionen mit normaler Bewegung bei allen Breiten und beiden Themes; lebender Wechsel zu Reduced Motion |
| URL/Fokus | Native Home-Auswahl, Fokus nach Wechsel, kein neuer History-Eintrag, Erhalt anderer Parameter/Hash/State, Reload und frischer Browserkontext |
| Speicher | Sommer-Abgabe per Space, Reload und Wechsel; Winter-Abgabe mit Reload; Bestanden mit Reload und Rücknahme; gemeinsame IDs bleiben erhalten |
| Navigation | Vier Typfilter, Vergangenheit, beide Zeitfenster, Hover-/Fokus-/Escape-Tooltip, Punkt mit Filterrücksetzung und Kartenfokus/Scrollen, Danach-Chip |
| Tastatur/Touch | Vollständige Tabzyklen, Theme-Pfeile; zwei emulierte Touch-Aktivierungen der nativen Semesterwahl |
| Tageswechsel | Tatsächlich ausgelöster Mitternachtstimer bei fixierter Browseruhr: automatisch, fest gewählter Sommer und fest gewählter Winter |

Der erste volle AP5-Lauf bestand 150/157 Fälle. Sieben neue Theme-Tastaturfälle
fokussierten Hell, während Dunkel noch ausgewählt war, und erwarteten deshalb
fälschlich System als nächsten Wert. Die Vorbereitung aktiviert nun Hell vor
dem Pfeildruck; die Assertions bleiben erhalten. Der anschließende vollständige
Lauf enthält zusätzlich beide Touch-Fälle und besteht 159/159.

## Winter-Gate

`archive-check.mjs` vergleicht `.top-grid` und `.appointments` jeweils vollständig,
ohne Masken, gegen vor dem Wechsler aufgenommene Referenzen. Zusätzlich ist die
gesamte Bounding-Box der Übersicht einschließlich ihrer Seitenposition exakt
gleich. Der neue Wechsler im Kopf ist die beabsichtigte sichtbare Ergänzung und
liegt außerhalb dieser Inhaltsbilder; vollständige Seitenbilder wurden ebenfalls
aufgenommen und repräsentativ angesehen.

**112/112 Winteransichten und 224 Inhaltsbilder bestehen mit 0 Playwright-Diffpixeln**
bei dem bereits im Repository verwendeten Maßstab `maxDiffPixels: 0, threshold: 0.1`.
Die Rohpixel werden zusätzlich unabhängig gezählt: alle 112 Terminlisten und 108/112
Übersichten sind RGBA-identisch; vier Übersichten haben zusammen **18** abweichende
Rohpixel (2, 7, 7, 2). Byte-/RGBA-Identität aller Bilder wird ausdrücklich nicht
behauptet. Der erste strikte Rohpixellauf hielt bei zwei Farbabweichungen an einer
runden Chipkante an. An diesem Fall wurden unverändertes `main` separat gestartet
und vollständiges Übersichts-HTML, sämtliche berechneten Komponentenstile und
Bounding-Boxes verglichen: identisch. In der Wiederholung war derselbe Fall
RGBA-identisch; die maximal sieben Rohpixel anderer Fälle sind protokolliert.
Keine bestehende Referenz wurde ersetzt und keine vorhandene Assertion geändert.

## Pflichtprüfungen

Der neue Seeding-Test scheiterte vor der Korrektur mit `actual: []`,
`expected: ['a1','a2']`. Nachher bestehen zehn AP5-Unit-Tests für Seeding,
Speicherstände, Parameter, Auswahl, Tageswechsel, Abschluss und Rückblick.
Die bestehende Zustandsassertion wurde von der fehlerhaft leeren Wintervorbelegung
auf die bereits dokumentierten Sommer-IDs geändert; dies ist im Fix-Commit begründet.

Zehn vorhandene AP2-Sonderfälle injizierten ausschließlich vergangene Abgaben,
um die aktive Abgabenstatistik zu prüfen. Diese Daten sind mit AP5 absichtlich
ein Archiv und zeigen deshalb keine aktive Statistik mehr. Die Fixtures enthalten
nun zusätzlich eine bereits vorhandene undatierte Winterprüfung und bleiben damit
offen. Alle bisherigen Assertions bleiben unverändert. Die zehn betroffenen Fälle
wurden nach dieser Anpassung vollständig wiederholt: **10/10 bestanden**.

```text
TZ=Europe/Berlin node --test tests/
tests 91; pass 91; fail 0; skipped 0

node --test scripts/css-duplicates.test.mjs
tests 3; pass 3; fail 0; skipped 0
```

## Grenzen

Die vorhandene Chromium-Suite wurde **vollständig** mit
`--update-snapshots=none` ausgeführt: **765 Fälle, 685 bestanden, 80 fehlgeschlagen,
0 übersprungen, 0 flaky**, Laufzeit 9,3 Minuten. Darin sind die zehn oben
beschriebenen und anschließend mit 10/10 bestandenen Fixture-Fälle enthalten.
Es verbleiben **70 bekannte Bestandsfehler**: 50 fehlende Bildreferenzen, zehn
mehrdeutige `.expired`-Selektoren, neun Linearitätsprüfungen an Hitboxmitten statt
Datumspunkten und ein Gleichdatumsvergleich mit `undefined`. Je ein Vertreter
aller vier Klassen wurde gegen separat gestartetes unverändertes `main` wiederholt:
derselbe Fehler, beim Linearitätsfall auch exakt derselbe Messwert
`1.2880208333333343`. Diese Fehler und Assertions bleiben außerhalb des AP5-Diffs.
Die gesamte Bestandssuite ist ausdrücklich **nicht grün**; es wurden keine
Bildreferenzen angelegt, akzeptiert oder aktualisiert.

Der vorhandene `ux-check.mjs` lief am Endstand zusätzlich bei 375×812 dunkel,
Reduced Motion, 18.02.2027 und 1200×900 hell, normale Bewegung, 11.11.2026:
keine Browser-Konsolenmeldungen, `scrollWidth = innerWidth`, keine kleinen Ziele
oder Labelüberschneidungen. Semestertext-Kontrast 10,81:1 beziehungsweise 8,52:1.

Firefox, WebKit, physische Geräte und ein akustischer Screenreader-Test wurden
bewusst ausgelassen. Die vollständige Tagesmatrix verwendet Reduced Motion;
normale Bewegung, Systemwechsel und Interaktionen sind getrennte Fälle, nicht
jede denkbare Kombination. Nur repräsentative Bilder wurden manuell angesehen.
Die native Auswahlliste folgt dem Browser-/Betriebssystemdesign; die Kontrastmessung
prüft den sichtbaren Semestertext und die neuen Archivtexte im Dokument.

## Folge-Vorschläge

- Die bereits dokumentierten fehlenden Bildreferenzen, mehrdeutigen Statusselektoren
  und Messungen an Hitboxmitten separat bereinigen.
- Ergänzende Firefox-/WebKit-, Geräte- und Screenreader-Abnahme durchführen.
