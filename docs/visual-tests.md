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
