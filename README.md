# Semester-Roadmap

Frameworkfreies Dashboard für Prüfungen, Abgaben und persönliche Termine.
ES-Module laufen direkt im Browser: kein Build, keine Laufzeit-Abhängigkeiten.

## Lokal starten

```bash
python3 -m http.server 8000
```

Dashboard: <http://localhost:8000>. Browser-Regression: <http://localhost:8000/tests/regression.html>.

## Funktionen

- Nächster offener Einzeltermin mit Countdown, zweitem Prüfungstermin und zwei Danach-Buttons.
- Prüfungskarten mit A-/B-Zeilen (A = 1. Termin, B = Wiederholung); der nächste offene Termin erhält die große Darstellung.
- Prüfungen ohne Datum: „Termin noch offen“, frühestes Datum, kein Countdown.
- Einheitliche Terminzeilen auch für Abgaben und persönliche Termine.
- Eingepasster linearer Zeitstrahl mit einem Punkt je Termin, Semester-/Ab-heute-Fenster,
  Kurznamen, Tooltip und direkter Navigation zur Karte.
- Offenes Prüfungsband ohne erfundenes Enddatum.
- Monatliche Listengruppen und eigene Gruppe „Termin noch offen“; ein bis vier Spalten.
- Abgaben abhaken; nach vergangenem A und vor einschließlich B: „Bestanden – B entfällt“.
  Die Auswahl wird lokal gespeichert; Rücknahme bleibt auch nach B möglich.
- Abgabe-Checkbox mit sichtbarem Zustand „Offen“/„Erledigt“; die Abgabenkachel und ihr
  Fortschritt bleiben bis zur vollständigen Erledigung neutral (auch bei 0/0).
- Hero mit dem Wochentag des nächsten Termins und eigener Inhaltshöhe ab 840px.
- Hell-, Dunkel- und Systemmodus, Tastaturfokus, Live Reduced Motion und Tageswechsel.

Bis einschließlich **10.11.2026** bleibt das Sommersemester 2026 aktiv.
Am **11.11.2026 um 00:00 Uhr lokaler Gerätezeit** wird das Wintersemester 2026/2027
aktiv, auch im bereits geöffneten Tab. Der letzte Sommertermin liegt am 10.11.
Die Sommerdaten sind unverändert erhalten.

Die Semesterzeile im Kopf ist eine native, mit Tastatur und Touch bedienbare Auswahl
für alle Einträge aus `SEMESTERS`. Ohne gültiges `?semester=<id>` gilt weiterhin das
nach Datum aktive Semester. Eine Auswahl setzt den Parameter mit `history.replaceState`;
Reload behält sie, auch über einen Tageswechsel. Die Semesterwahl wird nicht lokal
gespeichert: Ein neuer Besuch ohne Parameter zeigt das aktive Semester.

Ein Semester erscheint als Archiv, sobald **alle nicht-`calOnly`-Events nach ihrem
letzten Kalendertag vergangen** sind. Der letzte Termintag zählt vollständig mit;
undatierte Prüfungen verhindern den Abschluss, auch nach allen bekannten Terminen.
Erledigt-Markierungen ersetzen keine fehlenden Daten. Beim Öffnen eines Archivs
sind „Semester“ und „Vergangene anzeigen“ voreingestellt; beide bleiben umschaltbar.
Der Heute-Marker erscheint dort nur innerhalb der tatsächlichen Terminspanne,
nicht in deren grafischem Randabstand.

Der Rückblick zählt Prüfungs-Events einschließlich abgebrochener Prüfungen einmal,
nennt davon die ausdrücklich als bestanden markierten, nicht abgebrochenen Prüfungen
und zählt erledigte/gesamte nicht abgebrochene Abgaben sowie alle Abbrüche separat.
Es werden keine Noten oder bestandenen Prüfungen aus vergangenen Daten abgeleitet.
Die Archivstatistik ersetzt die Sieben-Tage-Vorschau durch Statuszahlen.
Bestehende Häkchen bleiben bedienbar und verwenden denselben gemeinsamen lokalen
Speicher mit global eindeutigen Event-IDs. **Änderungen im Archiv ändern diesen
gemeinsamen Speicher.** Die `isDone`-Vorbelegung wird über alle Semester ermittelt,
wenn noch kein Speicherstand existiert; ein vorhandenes leeres Array bleibt leer.

## Daten pflegen

`js/data.js` enthält `EVENTS`/`PERIODS` für den Sommer und `SEMESTERS` für die Auswahl.
Neue IDs müssen semesterübergreifend eindeutig sein. Winter-IDs beginnen mit `ws26-`.

Bestehende Einträge bleiben gültig:

```js
{ id: 'beispiel', type: 'Abgabe', title: 'Portfolio', date: '2026-12-18', time: 'Uhrzeit offen' }
```

Alternativ wird `sittings` verwendet, ohne gleichzeitiges `date`/`time` am Event:

```js
{ id: 'pruefung', type: 'Prüfung', title: 'Rechenmethoden', short: 'Rechenmeth.',
  sittings: [
    { key: 'A', date: '2027-02-22', time: '10:00–12:00 Uhr' },
    { key: 'B', date: '2027-04-01', time: '10:00–12:00 Uhr' },
  ] }
```

Keys sind A/B und je Event eindeutig; B darf nicht vor A liegen. Jeder Termin
benötigt ein gültiges Datum und eine nichtleere Zeitangabe. Nur Prüfungen dürfen
`sittings: []` haben. Das Semesterfeld `examsFrom` nennt das früheste Datum;
`earliest` am Event kann es überschreiben. Ungültige Events werden einzeln mit
Warnung übersprungen. Daten werden durch die Normalisierung nicht verändert.

Die Winterprüfungen liegen **2027**, aus dem Semesterkontext abgeleitet.
Das ASP-Portfolio liegt am **18.12.2026**, Zeit **„Uhrzeit offen“**.
Fünf Prüfungen sind undatiert, frühestens ab **Mo., 15.02.2027**.
Unbekannte Zeiten und Enddaten werden nicht ergänzt.

Weitere Felder:

| Feld | Wirkung |
| --- | --- |
| `short` | Kurzname im Zeitstrahl, sonst vollständiger Titel |
| `room` | Optionaler nichtleerer Raumtext am Event oder einzelnen Termin; der Termin überschreibt das Event |
| `isCancelled` / `cancelReason` | Abgebrochen, optionaler Grund; kein Countdown |
| `isDone` | Initial erledigte Abgabe/Prüfung, sofern kein Speicherstand existiert |
| `hideFromNext` | Aus Hero/Danach ausblenden; Liste und Sieben-Tage-Statistik behalten den Termin |
| `calOnly` | Beibehaltenes Altdatenflag; diese persönlichen Einträge werden nicht angezeigt |

Kalenderexport als `.ics` ist pro Karte und für das Semester verfügbar. Exportiert werden datierte Termine ab heute, außer abgebrochenen oder erledigten Einträgen; undatierte Prüfungen erzeugen keinen Termin. Unbekannte Uhrzeiten werden als Ganztag exportiert.

## Terminlogik

Eine Karte repräsentiert ein Event. Hero/Danach repräsentieren einzelne Occurrences:
`<eventId>-A`, `<eventId>-B`; ein Legacy-Einzeltermin behält seine ID.
`eventId` führt immer zur gemeinsamen Karte. Gleiche Daten behalten die Datenreihenfolge.

Der nächste Termin liegt heute oder später. Nach A bleibt eine Prüfung mit offenem B
aktuell; erst nach dem letzten Termin ist sie vergangen. Karten sortieren nach dem
nächsten offenen, sonst letzten Termin. Undatierte Prüfungen folgen allen datierten
Karten in Datenreihenfolge. Der Typfilter „Sonstiges“ bezeichnet persönliche Termine und betrifft ausschließlich die Liste;
Navigation setzt nötige Filter zurück.

„Einträge“ zählt jedes Event einmal, einschließlich undatierter Prüfungen, ohne
abgebrochene Events. „Davon … ohne Datum“ nennt offene undatierte Prüfungen.
„Termine in 7 Tagen“ zählt einzelne Termine von heute bis einschließlich heute +7,
ohne abgebrochene oder erledigte Events. Erledigte Prüfungen bleiben in der Gesamtsumme.

Der Zeitstrahl verwendet eine DST-sichere Kalendertagsskala und 44px-Ziele.
„Ab heute“ enthält zukünftige, nicht erledigte, nicht abgebrochene Termine;
`hideFromNext` bleibt sichtbar. Das Semesterfenster zeigt zur Einordnung auch
erledigte und abgebrochene Termine. Nur Abbrüche erhalten hohle Punkte mit Strich;
B ist kleiner und gefüllt. Undatierte Prüfungen erzeugen keinen Punkt.

## Architektur und Design

| Datei | Verantwortung |
| --- | --- |
| `js/app.js` | Start, Simulation, Ready-Status und Observer |
| `js/state.js` | Expliziter Zustands-Snapshot, Transaktionen und serialisierte Speicherung |
| `js/semesters.js` | Validierte Semesterparameter, kalendertagsbasierter Abschluss und Archivzahlen |
| `js/semester-control.js` | Native Semesterwahl, URL und Fokus nach dem Wechsel |
| `js/scheduler.js` | Gemeinsame, abwartbare Renderanforderung je Animation Frame |
| `js/render.js` | Renderfolge, unveränderter Fokus-/Scroll-Erhalt und Tageswechsel |
| `js/theme.js` | Gespeichertes/System-Theme und Tastaturbedienung |
| `js/hero.js` | Nächster Termin, Danach und Periodenfortschritt |
| `js/timeline.js` | Lineare Zeitskala, Legende, Tooltip und Kartenauswahl |
| `js/list.js` | Filterung, Gruppierung und Karten |
| `js/stats.js` | Statistik und Zahlen-Feedback |
| `js/filters.js` | Filter-Steuerelemente und Zustandsänderungen |
| `js/ui.js` | Ripple, Indikator, Fortschritt und Fokusziele |
| `js/clock.js` | Gemeinsame Datumsquelle und validiertes `?heute=` |
| `js/cards.js` | Terminzeilen und zugängliche Namen; `sittingRows()` entscheidet A/B-Hierarchie |
| `js/utils.js` | Validierung, Datumsmathematik, Occurrences, Sortierung, Statistik |
| `js/layout.js` | Lineare Skala, kollisionsfreie Reihen, Overlay- und Listengeometrie |
| `js/motion.js` | Spatial-/Effects-Federn, DOM-Abgleich und `syncSittingRows()`-FLIP |
| `js/storage.js` | Erledigt-/Bestanden-Speicherung |
| `css/styles.css` | M3-Tokens in `:root`, Themes, Komponenten und Motion-Layer |

M3-Fensterklassen: <600, 600–839, 840–1199, 1200–1599 und ≥1600 px.
Die Liste nutzt ihre volle Breite; Containergrenzen 660/1000/1300 px ergeben 2/3/4 Spalten.
Ab 1600 px entfällt die Inhalts-Maximalbreite. Ohne Container Queries greifen
Viewport-Fallbacks bei 840/1200/1600 px.

Kartenradius 28px minus 16px Padding ergibt 12px Innenradius. Große Terminzeilen
haben mindestens 64px, kleine/offene mindestens 48px. Größen/Farben/Schriften
verwenden Rollen-Tokens; keine dekorativen Rahmen. Touch-Ziele sind mindestens 44px.
Spatial darf überschwingen, Effects nicht. Reduced Motion wird live respektiert.
`syncHTML`/`syncChildren` erhalten Knoten über stabile IDs/Keys; die A→B-Vergrößerung
verwendet nur Transform-FLIP, keine Font-Size-Transition.

Roboto Flex wird lokal als variable WOFF2-Schrift unter OFL-Lizenz ausgeliefert; ein System-Fallback bleibt verfügbar.
Self-Hosting wurde versucht; der Abruf ist in dieser Umgebung mit HTTP 403 gesperrt.
Die einmalige Font-Ready-Neuberechnung bleibt für korrekte Labelmessung erhalten.

## Verifikation

```bash
TZ=Europe/Berlin node --test tests/
node --test scripts/css-duplicates.test.mjs
```

**91/91 Node-Tests und 3/3 Scanner-Tests bestanden.** Sommer-Fingerprint, A/B-Randfälle,
Validierung, Sortierung/Gruppierung, Occurrences, Statistik, ARIA-Ausgabe und Motion enthalten.
**Historischer Browser-Befund vor AP0:** 507 Fälle erkannt, ein Chromium-Start vor Seitenaufruf
fehlgeschlagen; Browserdownload HTTP 403, kein System-Chrome. Keine neuen Screenshots
oder gemessenen DOM-Höhen. Das Höhenziel 200–220px bleibt bei dichten Daten offen.

Aktueller AP1-Nachweis: [HTML-/Pixel-Gate, Matrix und Renderzahlen](docs/ap1-identity.md).
AP2: [Komponentenabnahme und abgegrenzte Bestandsfehler](docs/ap2-verification.md).
AP5: [Semesterwahl, Archiv und Winter-Pixel-Gate](docs/ap5-verification.md).

Details: [Abnahmebericht](docs/verification-report.md), [Designentscheidungen](docs/design-plan.md),
[Browseranleitung](docs/visual-tests.md). Ausgangsstand: `9278abb` vom 24.10.2026;
`pre-calendar-removal` wurde lokal vor den Änderungen gesetzt.

## Mitwirkende

[<img src="https://avatars.githubusercontent.com/u/267193182?s=64&v=4" width="32" height="32" alt="Codex-Profilbild">](https://github.com/codex)

[Codex](https://github.com/codex) hat zu diesem Projekt beigetragen.
