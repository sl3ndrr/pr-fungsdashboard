# Visuelle Regressionen (PR B)

Playwright **1.62.1** ist die einzige neue direkte Abhängigkeit, ausschließlich
als Dev-Werkzeug im eigenen Paket `tests/visual/`. Seine transitiven Pakete
stehen im Lockfile. Die Seite bleibt statisch, frameworkfrei und ohne Build.
Die Node-Regressionen benötigen weder npm-Installation noch Browser:

```bash
TZ=Europe/Berlin node --test tests/
```

## Ausführen und Baselines aktualisieren

Aus dem Repository-Verzeichnis mit Docker. Testpaket und offizielles Image
verwenden dieselbe gepinnte Playwright-Version und Ubuntu Noble; Referenzen
werden ausschließlich in diesem Image erzeugt. Die externe Google-Font-Anfrage
wird abgefangen, damit die Schriften des Images deterministisch bleiben.

```bash
# Vergleich mit eingecheckten Baselines
 docker run --rm --ipc=host -v "$PWD:/work" -w /work/tests/visual \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -lc 'npm ci --ignore-scripts && npm test'

# Referenzen bewusst aktualisieren, danach Actual/Diff und PNGs prüfen
 docker run --rm --ipc=host -v "$PWD:/work" -w /work/tests/visual \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -lc 'npm ci --ignore-scripts && npm run update'

git add tests/visual/__snapshots__/
```

`__snapshots__/` ist nicht ignoriert und soll mit den geprüften Baselines
committet werden. Reports, Traces und Testresultate sind ignoriert. Ohne Baseline
schlägt der Vergleich fehl; er akzeptiert keine automatisch erzeugte Referenz.
Lokale Installation ist für Debugging möglich:

```bash
cd tests/visual
npm ci --ignore-scripts
npx playwright install --with-deps chromium firefox webkit
npm test
```

`webServer` startet `python3 -m http.server 8765 --bind 127.0.0.1` am Repo-Root,
entsprechend dem HTTP-Server im README. Es gibt keinen eigenen Node-Webserver.
`DASHBOARD_ROOT` kann für einen Vergleich einen anderen App-Checkout liefern;
der Testcode und die Baselines bleiben stets aus dem aktuellen Testpaket.

## Matrix und Determinismus

- Chromium, Firefox und WebKit gemäß Design-Plan; 360/768/1280/1600 px,
  Hell/Dunkel über `emulateMedia`; zusätzlich System und eine kleine
  Reduced-Motion-Variante bei 360 px, Hell, in allen drei Browsern.
- Vollseite und separate Komponenten: Zeitstrahl samt Legende, Statistik,
  „Als nächstes“ sowie Abgebrochen/Erledigt/Abgelaufen/Heute/Zahlen-Countdown.
- `page.clock.setFixedTime` setzt **01.10.2026, 12:00 Europe/Berlin**.
  Das ergibt ASP Tag 25 von 33 mit 8 Resttagen, erledigte `a1`/`a2`, den
  abgebrochenen `p4` und `p6` mit sechs Tagen. Nur in abgefangenen Modulantworten
  ergänzen Fixtures einen heutigen und abgelaufenen Termin sowie einen
  synthetischen Abbruchgrund. Die Repository-Datei `js/data.js` bleibt unverändert.
- Separate Hero-Fälle frieren 25.09., 06.10. und 07.10.2026 ein, für zwölf Tage,
  einen Tag und „Heute“. Locale und Zeitzone sind fest; jeder Kontext startet
  mit isoliertem LocalStorage.
- Echte Hero-/Statistik-Balken und `.timeline-progress` erhalten per DOM die
  Werte **0/3/50/76/97/100 %**. Wellenbilder pausieren `document.getAnimations()`
  und setzen die unendliche Phase exakt auf **0/600/1300 ms**; endliche
  Animationen werden beendet. Diese Bilder verwenden `animations: 'allow'`,
  alle übrigen `animations: 'disabled'`.
- Geometrieprüfungen kontrollieren gemeinsame Track-/Fill-Phase, Maskengröße,
  unskalierte Füllung und Zeitstrahl-Endkappen; zusätzlich Fokus/Escape/Touch,
  Tooltips ohne Labelkollision und Erhalt manueller Scrollposition.

## Gegenprobe vor PR A

Die unveränderten Tests gegen den App-Stand vor A ausführen, ohne dessen
Markup oder CSS in den Test-Harness zu kopieren. Aus dem Repo-Root:

```bash
git worktree add --detach /tmp/dashboard-before-a c231de8caf253143d72b372705cfd72e63f9d1d0
docker run --rm --ipc=host -v "$PWD:/work" \
  -v /tmp/dashboard-before-a:/before-a:ro -e DASHBOARD_ROOT=/before-a \
  -w /work/tests/visual mcr.microsoft.com/playwright:v1.62.1-noble \
  bash -lc 'npm ci --ignore-scripts && npm test -- --project chromium --grep "shared phase 360px light"'
```

Erwartet wird ein Fehler an der Track-/Fill-Phase oder der skalierten Füllung;
Actual/Diff muss den ursprünglichen Fehler zeigen. Anschließend auch die
Status-/Timeline-Fälle gegen diesen Stand ausführen. Ein fehlendes Browserprogramm
oder eine fehlende Baseline zählt nicht als Nachweis dieser Gegenprobe.

## Tatsächlicher Prüfstatus

102 Browserfälle wurden erfolgreich geladen, 16 Node-Tests bestehen; der
Python-Webserver startet. Der Browserlauf stoppt vor dem Seitenaufruf, weil
Chromium Headless Shell fehlt. Ein Download-Versuch erreichte die Quelle nicht;
Docker ist in dieser Umgebung nicht installiert. Deshalb wurden **keine
Baselines erzeugt oder eingecheckt**, kein Docker-Lauf und keine Vor-A-Gegenprobe
nachgewiesen. PR B bleibt unvollständig und ein Entwurf, bis diese Schritte
in der beschriebenen Umgebung ausgeführt und die Bilder geprüft sind.

Ein CI-Workflow wird ausschließlich im PR vorgeschlagen und erst nach Freigabe
angelegt. Die zuvor vorhandene Workflow-Datei wird mit dieser Korrektur entfernt.


## Layout-Optimierung – geänderte Erwartungen

Die gemeinsame Timeline-Tooltip-Fläche ist `#timeline-tooltip` direkt im Body.
Tests dürfen sie nicht mehr als Kind eines Punktes suchen. Sie muss innerhalb
des Viewports liegen und darf die Kachelhöhe beim Öffnen nicht verändern.
`layout.spec.mjs` prüft gemeinsame Kartenzeilen, ARIA-Zuordnung, 1600×900,
rechts stehende Countdowns, Fokus-/Knotenerhalt und Reduced Motion.
Die Matrix enthält zusätzlich 2300 px. Die Achsen- und Abstandserwartungen
bleiben unverändert; neue Node-Tests prüfen die begrenzte Schienenverteilung.

Aktueller Laufstatus: 20 Node-Tests bestanden. Lokale Playwright-Installation
ist vorhanden, Browser-Binaries fehlen. Downloadversuch am 11.10.2026 endet
mit HTTP 403. Browsermatrix und Screenshots **nicht visuell verifiziert**.
Vorhandene visuelle Baselines wurden nicht erfunden oder automatisch ersetzt.

Phase 2 ergänzt Seitenspalten-Prüfungen bei 768/1280/1600/2300 px: Standard,
380–440-px-Breite, sticky, Toggle, Tagesdetails/Popover und Kartenidentität.
In der Seitenspalte führt der Tages-Button zum Termin-Popover über Tagesdetails;
die Vollbreitenansicht behält separate Event-Tags. `tests/regression.html`
berücksichtigt den standardmäßig geschlossenen Kalender, das explizite Öffnen der
Desktop-Seitenspalte und 2300 px.
Diese Fälle sind vorbereitet, nicht im Browser ausgeführt.

Phase 3: 22 Node-Regressionen und 3 Scanner-Checks bestanden. Die Wellen-
Pause wird jetzt am `::before`-Pseudo-Element geprüft, die gemeinsame Transform-
Phase weiterhin an Track/Füllung. Alte Property-Registrierungs-Erwartungen sind
bewusst ersetzt, weil genau diese Main-Thread-Vererbung entfernt werden sollte.
Browser-/Kaskaden-/Performance-Verifikation bleibt offen. Selbsthosting der
Schrift ist blockiert; externe Font-Routen bleiben im Test-Harness abgefangen.


### Zeitstrahl: Reproduktion am 22.10.2026

Ausgangsbasis: `main` bei `9e64033431ce0f5a7754e8292b60f4bf9980bc22`.
Die GitHub-Actions-Historie weist erfolgreiche Pages-Deployments von `main` aus,
zuletzt Run `39849930396` für genau diesen Commit. Die ausgelieferten Bytes sind
hier nicht überprüfbar: sowohl HTTP als auch der Cloud-Browser erhalten für
GitHub Pages die Netzwerkantwort `Forbidden. Calls to this URL are not allowed.`
Playwright ist installiert, Browser-Binaries fehlen. Der Installationsversuch
wird für `cdn.playwright.dev` mit derselben HTTP-403-Antwort gesperrt.
**Eine Browser-Reproduktion des gemeldeten Screenshots und dessen Ursache sind
somit nicht belegt.** Es werden keine synthetischen Screenshots als Nachweis ausgegeben.

Die Node-Reproduktion bestätigt die korrekte Grenze am 22.10. bei 342/390 px.
Ein ergänzter Regressionstest scheiterte auf der Ausgangsbasis: zwei identische
Daten erhielten x=52,4 und x=84,4, Heute aber deren Mittelpunkt. Phase 1 legt
gleiche Daten auf denselben x-Wert und trennt Touch-Ziele vertikal um 44 px.
Die Eingabereihenfolge gleicher Daten bleibt stabil. Der Fortschritt erhält
keine Breitenanimation mehr, damit seine Grenze auch beim Einstieg mit Heute
übereinstimmt.

`timeline.test.mjs` prüft jeden Tag vom 01.06. bis 12.11.2026 für jede ganzzahlige
Breite 280–1000 px; dazu Eventtage, DST, leere Semester und konkrete Renderwerte
bei 342/390 px. `semester-timeline.spec.mjs` ergänzt Bounding-Box-Prüfungen nach
Laden, Rotation, verstecktem Layout und `pageshow`, inklusive Reduced Motion.
Diese Browserfälle müssen bei verfügbaren Binaries noch ausgeführt werden.

### Phase 2: lineare Achse und mobile Bedienung

Die Achse ist jetzt linear in **Kalendertagen**, mit mindestens 44 px Abstand
zwischen verschiedenen Termintagen. Dichte Termine vergrößern die gesamte
Achse; keine Kollisionskorrektur verschiebt mehr einzelne Daten. Gleiche Daten
haben denselben x-Wert und verschiedene vertikale Touch-Ziele. Die standardmäßig
eingeklappte Vergangenheit wird als „N vergangen“ gezählt (nicht als „erledigt“,
da vergangene und abgebrochene Prüfungen keine erledigten Abgaben sind).
Das Fokusfenster beginnt 14 Tage vor Heute und reicht über den letzten Termin;
14 Tage Rand erlauben eine zentrierte Heute-Markierung auch an den Enden.

Der nächste nicht abgebrochene Termin hat eine dauerhafte Kurzbeschriftung mit
Datum. Kreise, Quadrate und Rauten unterscheiden die Terminarten; ein Querstrich
markiert Abbrüche. Neutrale vergangene Punkte unterscheiden sich von aktiven
Typfarben. Zeitraum-Balken und zugehörige Texte folgen unter Heute-Pill und
Monatsmarken. Im sichtbaren Ausschnitt wird ein identischer Zeitraumtext nur
einmal ausgegeben. Die aufklappbare Zeichenerklärung enthält nur sichtbare
Typen und Abbruchstatus. Der nächste Termintext bleibt auch beim Scrollen im
sichtbaren Ausschnitt lesbar.

Initiales Layout und Resize zentrieren Heute. Manuelles Scrollen blendet den
Text-Hinweis aus; Randverläufe zeigen weiterhin verfügbaren Inhalt. Gewöhnliche
Re-Renders und der Datumswechsel erhalten Scrolloffset und Aufklappzustand.
Der vorhandene Timer bis zur lokalen Mitternacht sowie `visibilitychange` und
`pageshow` bleiben erhalten; beim Tageswechsel wird keine Einstiegsanimation
wiederholt. Der erste Touch zeigt Details, öffnet nötige Listenfilter und
markiert die zugehörige Karte. Der zweite Touch sowie Enter navigieren weiter
wie zuvor. Die 7-Tage-Statistik nennt „Termin“ beziehungsweise „Termine“.

**Bewusste Testanpassungen:** Eine lineare Achse darf auch auf dem Desktop
horizontal scrollen, wenn andernfalls der Mindestabstand unterschritten würde.
Der frühere Test „Desktop niemals scrollbar“ widersprach diesem Ziel und prüft
weiterhin, dass die Seite selbst keinen Überlauf hat. Nach Resize wird nun
explizit die Zentrierung statt des alten manuellen Scrolloffsets erwartet.
Außerhalb der Termindaten liegt Heute in der datumsgenauen Randzone, statt am
Ende der Achse auf 0/100 % zu springen. Das Ende der Termindaten bleibt 10.11.;
Randzonen ändern diese Daten nicht.

Aktueller Stand: **43 Node-Tests und 3 CSS-Scanner-Tests bestanden**. Der Scanner
`css-duplicates.mjs` läuft weiterhin. Textkontraste wurden für beide Paletten
rechnerisch gegen WCAG AA geprüft, einschließlich der getönten Zeitraumflächen;
vergangene Punkte erreichen mindestens 3:1. Browser-Layout, tatsächliche
Schriftmetriken, CLS und die drei Browser-Engines sind wegen fehlender Binaries
weiterhin **nicht visuell verifiziert**. 297 Playwright-Fälle werden geladen.

Die neuen Browserfälle prüfen 390×844, Bounding-Box-Grenzen, nächste Beschriftung,
Heute im Zentrum nach Rotation, ein verstecktes erstes Layout, gleich datierte
Events, Chip-Zustand bei Re-Renders, gefilterte Touch-Navigation und einen echten
Timerlauf über Mitternacht (`clock.install` / `pauseAt` / `runFor`, ohne ein
künstlich ausgelöstes `pageshow`). Der vorhandene Semesterwechsel-Test prüft
den Wake-up-Pfad weiterhin separat.

#### Vorher-/Nachher-Bilder bei 390×844 erzeugen

Nach Installation der vorhandenen Dev-Abhängigkeiten und Browser:

```bash
# Repo-Root: unveränderte Ausgangsbasis für den Vorher-Lauf bereitstellen
git worktree add --detach /tmp/timeline-before 9e64033431ce0f5a7754e8292b60f4bf9980bc22
cd tests/visual
DASHBOARD_ROOT=/tmp/timeline-before npx playwright test semester-timeline.spec.mjs \
  --project chromium --grep '390px review screenshots' --output test-results/before
npx playwright test semester-timeline.spec.mjs \
  --project chromium --grep '390px review screenshots' --output test-results/after
npm test
```

Die beiden Review-Fälle schreiben je ein Viewport-PNG und ein Detail-PNG der
Timeline für Dark und Light in die jeweiligen Ergebnis-Unterordner. Diese
Capture-Fälle verwenden auch im Vorher-Lauf ausschließlich bereits vorhandene
Selektoren. Die PNGs anschließend prüfen; Snapshot-Baselines nur bewusst im
oben beschriebenen gepinnten Docker-Image aktualisieren. In dieser Umgebung
wurden keine Vorher-/Nachher-PNGs erstellt.

Bewusst weggelassen: Scroll-Snap (würde das freie Erkunden der Tagesachse
erschweren), eine zweite Kalender-/Listenauswahl für die Timeline (bestehende
Navigation wird wiederverwendet), produktive Datenänderungen und neue
Abhängigkeiten. Die Ursache des ursprünglichen Handy-Screenshots bleibt offen;
der reproduzierte Gleichdatumsfehler ist ein separater, belegter Fehler.
