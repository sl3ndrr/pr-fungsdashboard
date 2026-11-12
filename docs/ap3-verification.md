# AP3: Zeitstrahl und Terminliste

Basis: `main` = `341207b` vom 12.11.2026. AP1 ist am Code nachgewiesen:
aufgeteilte Module, expliziter Store und gemeinsamer RAF-Scheduler sind vorhanden.
AP2 ist auf dieser Basis ebenfalls enthalten. Branch: `ap3/zeitstrahl-liste`.

## Entscheidungen

- **A5:** Die Phasenbeschriftung sitzt oberhalb des Bandes. Eine Führungslinie endet
  mit einem senkrechten Startmarker genau bei `--phase-start`; erst dort beginnt die
  tonale Fläche. „Ende offen“ steht zusätzlich zum zugänglichen Namen sichtbar am
  Label. Der Text wird innerhalb der verfügbaren Breite positioniert. Es gibt kein
  ergänztes Enddatum und keinen Fortschrittswert.
- **A6:** Monatsbeschriftungen werden bei Platzmangel ausgelassen, ihre Achsenticks
  bleiben erhalten. Alle sichtbaren Monatslabels stehen in einer einzigen Zeile.
  Der Jahreswechsel hat Vorrang vor dem ersten Label, danach gilt die zeitliche
  Reihenfolge. Periodenlabels behalten das bisherige Verfahren mit mehreren Zeilen.
  Die lineare Abbildung von Kalendertagen und die Positionen der Termine ändern sich nicht.
- **A9:** Gewählt ist Variante (a), früher Zeilenumbruch beim Gruppenwechsel.
  Eine vollbreite Überschrift beendet die vorherige Kartenzeile, ohne leere DOM-Zellen.
  Variante (b), getrennte Raster je Gruppe, wurde als Browserprototyp mit denselben
  Karten verglichen: Winterdaten und 13 synthetische Karten mit unterschiedlich langen
  Titeln, jeweils bei 600/840/1200/1600px (1/2/3/4 Spalten). Beide Varianten wurden
  mit `start` und `stretch` aufgenommen. Nach Abklingen des Zustandsfeedbacks sind
  alle 16 entsprechenden a/b-Bildpaare pixelgleich. Die Wahl vermeidet zusätzliche
  Rasterwrapper und erhält direkte, stabil abgeglichene Kartenknoten im gemeinsamen
  Raster. Gruppenüberschrift und ARIA-Verknüpfung gehören jeweils nur zu einer Gruppe.
- **A10:** `align-items: stretch` statt `start`. Bei synthetischen mehrzeiligen Titeln
  und den unterschiedlich hohen Winterkarten schließen die Kartenkanten derselben
  Zeile bündig ab. Die Höhe richtet sich je Zeile nach der höchsten Karte; es gibt
  keine feste Höhe. Die bewusst freien Spalten am Gruppenende bleiben sichtbar.
  DOM- und visuelle Lesereihenfolge bleiben chronologisch.
- Das optionale dritte Zeitfenster wird als Folgearbeit zurückgestellt. Dieser PR
  konzentriert sich auf die vier verpflichtenden Befunde und ihre Abnahme.

## Reproduzierbare Prüfungen

Die drei neuen Node-Tests prüfen das Ausdünnen mit Prioritäten, das Fortsetzen langer
Gruppen bei 1–4 Spalten sowie die lineare Position des Phasenanfangs und seiner
Führungslinie. Der bisherige `appointmentRows`-Test wurde wegen des ausdrücklich
beauftragten Gruppenumbruchs angepasst.

```text
TZ=Europe/Berlin node --test tests/
tests 76; pass 76; fail 0; skipped 0
node --test scripts/css-duplicates.test.mjs
tests 3; pass 3; fail 0; skipped 0
```

Die Browserabnahme verwendet das bereits vorhandene Playwright 1.62.1 und Chromium 151.0.7922.34
auf Windows mit de-DE, Europe/Berlin und DPR 1. Python3 ist hier ein nicht ausführbarer
Windows-Store-Verweis; ein lokaler Node-HTTP-Server dient derselben statischen Anwendung
auf Port 8000. Der unveränderte main-Vergleich läuft separat auf Port 8001.
Kein zusätzliches Paket und keine Laufzeitabhängigkeit wurden eingeführt.

`tests/visual/timeline-list.spec.mjs` enthält 358 Fälle:

- 224 Kombinationen aus sieben Viewports, acht Tagen, Hell/Dunkel und normaler/reduzierter
  Bewegung; beide Zeitstrahlfenster werden jeweils gemessen und fotografiert.
- 112 Systemmodusfälle mit heller/dunkler emulierter Präferenz und anschließendem
  lebendem Wechsel der Präferenz, jeweils mit Reduced Motion.
- Acht synthetische Rasterfälle in beiden Themes und 1–4 Spalten.
- 14 Interaktionsfälle: Typfilter, Vergangenheit, Bestanden/Undo mit Reload,
  Tooltip per Hover/Fokus/Escape, Punkt- und Danach-Navigation mit Kartenfokus,
  Theme-Pfeiltasten, vollständiger Tab-Zyklus mit sichtbarem Fokus sowie
  Abgabe/Undo mit Reload und lebender Reduced-Motion-Wechsel.

Viewports: 320×640, 375×812, 600×900, 840×900, 1200×900, 1600×1000, 2300×1200.
Tage: 11.11., 15.12., 18.12.2026 sowie 16.02., 17.02., 18.02., 01.03., 08.04.2027.
Explizite Themes werden gegen die jeweils entgegengesetzte Systempräferenz geprüft.

Die Messungen prüfen Konsole, Seitenbreite, alle interaktiven Ziele, Zeitstrahllabel-
und Punktzielüberschneidungen, sichtbare Datumspunktkoordinaten gegen die lineare
Kalendertagsskala, Monatszeile, Textkontrast der geänderten Elemente, eindeutige IDs,
Gruppen-ARIA, vollständige Kartenreihenfolge und gleiche Höhen innerhalb einer Zeile.
Der Kontrast wird aus den berechneten Farben einschließlich transparenter Vorfahren
zusammengesetzt. Die Phasenbeschriftung liegt oberhalb der Verlaufsfläche.

Baseline-Screenshots wurden vor der ersten Produktänderung aufgenommen und angesehen.
Nach A5, A6 sowie A9/A10 entstanden neue Aufnahmen; die mobilen Zeitstrahlen und die
Listen mit echten/synthetischen Daten wurden jeweils verglichen. Der Variantenvergleich
wurde zusätzlich auf unverändertem main mit abgeklungenem Feedback wiederholt.
Alle PNGs und Rohmessungen bleiben in ignorierten `test-results/`-Ordnern.

Der vollständige Abschlusslauf am endgültigen Quellstand:

```text
timeline-list.spec.mjs (Chromium)
358 passed (6.0m); 0 failed; 0 skipped; 0 flaky
```

**792 geprüfte Zustände und 484 Screenshots:** keine Konsolenfehler/-warnungen,
kein horizontaler Überlauf, keine erfassten Label- oder Punktzielüberschneidungen.
Die kleinsten interaktiven Ziele messen **44×44px**, der niedrigste gemessene
Textkontrast der AP3-Elemente beträgt **7,29:1**. Die größte Abweichung einer sichtbaren
Datumspunktkoordinate von der linearen Kalendertagsskala beträgt **0,016px**.
Die 14 vollständigen Tastaturzyklen enthalten zusammen **266 Tab-Stopps mit sichtbarem Fokus**.
Repräsentative Abschlussbilder aller sieben Breiten, beide Themes, der Zustand nach
allen datierten Terminen und die synthetischen Mehrspaltenraster wurden angesehen.

Das vorgegebene `ux-check.mjs` wurde zusätzlich bei 375×812, dunkel, Reduced Motion,
18.02.2027 ausgeführt: keine Konsolenmeldungen, `scrollWidth = innerWidth = 375`,
keine kleinen Ziele und keine Labelüberschneidungen. Die Monats-, Phasen- und
Gruppenbeschriftungen erreichen dabei mindestens **10,00:1**.

## Bestehende Specs und Grenzen

Die vollständige vorhandene Chromium-Suite wurde mit `--update-snapshots=none`
ausgeführt: **405 Fälle, 334 bestanden, 71 fehlgeschlagen, 0 übersprungen**.
Ein Fehlschlag betraf die absichtlich geänderte Monatsausdünnung. Die Erwartung
„Nov 2026, Dez, Jan 2027“ wurde durch „Nov 2026, Jan 2027“ plus eine einzelne
Beschriftungszeile ersetzt. Die alte Erwartung einer gruppenübergreifend gefüllten
ersten Kartenzeile prüft jetzt die erste Zeile jeder eigenen Gruppe und den Abstand
zur vorherigen Gruppe. Keine Screenshotreferenz oder fachfremde Assertion wurde geändert.

Die betroffenen 58 Layout-/Zeitstrahlfälle wurden danach vollständig wiederholt:
**48 bestanden, dieselben zehn technischen Fehler wie auf unverändertem main**.
Auch main wurde mit diesen 58 unveränderten Fällen ausgeführt: **48 bestanden, zehn
fehlgeschlagen**. Die zehn Fehler sind neun Messungen der Hitboxmitte statt des
Datumspunktes und ein Gleichdatumsvergleich mit `undefined`.

Die übrigen bekannten Bestandsfehler sind 50 fehlende Screenshotreferenzen und zehn
Strict-Mode-Fehler des `.expired`-Selektors, der Terminzeile und Countdown zugleich
trifft. Sie sind bereits in `docs/ap2-verification.md` dokumentiert. Diese Bestands-
suite ist ausdrücklich nicht grün. Baselines wurden weder erstellt noch aktualisiert;
Assertions wurden nicht abgeschwächt. Die neue AP3-Abnahme misst die tatsächlichen
Datumspunkte unabhängig von den verschobenen Beschriftungs-Hitboxen.

Firefox, WebKit, physische Mobilgeräte und ein Screenreader-Hörtest wurden nicht
verwendet. Der Systemmodus wird mit Reduced Motion geprüft; normale Bewegung ist
in der vollständigen expliziten Hell-/Dunkelmatrix enthalten. Nur repräsentative
Screenshots wurden manuell angesehen, sämtliche Fälle werden geometrisch geprüft.

## Folge-Vorschläge

- Fehlende Referenzen nach separater Sichtprüfung anlegen und die drei bestehenden
  technischen Fehlerklassen in den Visual-Specs unabhängig reparieren.
- Optionales Fenster „Prüfungsphase“ aus erstem/letztem datiertem Prüfungstermin
  mit unveränderter linearer Skala und eigenem 320px-Bediennachweis ergänzen.
