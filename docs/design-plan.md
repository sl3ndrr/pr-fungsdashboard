# Semester-Roadmap: Design- und Umsetzungsstand

Stand: 24.10.2026. Drei aufeinanderfolgende Commits: A Zeitstrahl, B Seitenlayout,
C Material-3-Expressive-Konsistenz. „Implementiert“ bedeutet hier Code und Node-Checks;
ein Browser-Abnahmehaken wird erst nach tatsächlichem Browserlauf gesetzt.

## A – Zeitstrahl

- [x] Containerbreite statt horizontaler Scroller; Wischhinweis, Kantenverläufe,
  Zentrierung und manuelle Scrollzustände entfernt.
- [x] Eine lineare Skala über `calendarDayDiff` für Punkte, Heute, Monatsmarken und Bänder.
- [x] Connected Group „Ab heute | Semester“, Standard ab heute; Auswahl bleibt bei
  Filtern, Erledigt, Tages-/Semesterwechsel und Resize bestehen.
- [x] Zwei Tage Datumsrand; vollständige 44px-Ziele durch zusätzlichen 22px-Pixelrand.
  Abgebrochene Haupttermine begrenzen das Fenster mit; `calOnly` und Zeiträume nie.
- [x] Kurzname/Datum oder Datum-only; gemessene Textbreiten, disjunkte Reihen,
  abwechselnd oben/unten. Gleiche Daten behalten die Datenquellen-Reihenfolge.
- [x] Punkt und Label sind ein nativer Button. Ein Tap navigiert, nötige Listenfilter
  werden zurückgesetzt. Nächster offener Termin gefüllt; `hideFromNext` bleibt im Verlauf.
- [x] Zusätzlicher Hover-/Fokus-Tooltip auf Hover-Geräten, Escape; Scroll schließt das Overlay.
- [x] Tonale Bänder, Fenster-Clipping, vollständige Labels, kompakte sichtbare Typchips.
  Kurze Bänder bekommen die Beschriftung unmittelbar in einer eigenen Zeile daneben/darunter.
- [x] Monate mit ausgeschriebener Jahreszahl am ersten Label/Jahreswechsel;
  tatsächliche Monatsstriche behalten ihre lineare Position.
- [x] Heute-Pille in eigener oberster Reihe, z=9 vor der Linie z=2; Punkte/Labels
  darunter. Heute außerhalb des Semesterfensters wird am entsprechenden Rand geklemmt.
- [x] ResizeObserver nur bei Breitenänderung, Font-Ready-Neuberechnung; keine
  Scroll-Layoutfunktion. Stabile IDs, `syncHTML`, `listenOnce`, Fokus-/Scrollschutz.
- [ ] Browser-Bounding-Boxes, tatsächliche 44px-Touch-Auslösung, Höhenziel 200–220 px,
  Abnahme bei 320/360/390/600/820/1024/1280/1600/2300 px.

## B – Seitenlayout

- [x] Unter 840 px: Hero, Zeitstrahl, Statistik in dieser DOM-Reihenfolge.
- [x] Ab 840 px: Hero links, rechts flex-gestapelt Zeitstrahl und dreispaltige Statistik;
  Grid-Stretch gleicht die Gesamthöhen an. Hero-Inhalt nutzt freie Höhe.
- [x] Compact <600 px: Zahl links vom Titel; Tage bleibt unter der Zahl.
- [x] Titel nutzen `break-word` und `hyphens:auto` bei `lang="de"`.
- [x] M3-Fensterklassen 600/840/1200/1600; intrinsische Listen-Container-Queries bleiben.
- [x] Kalender-Seitenspalte bewusst auf Large ≥1200 px migriert, weiter 380–440 px,
  sticky, auf Wunsch geöffnet, mit Tagesdetails/Popover und erhaltenem Fokus.
- [ ] Tatsächliche Höhengleichheit ±1 px, volle Statistikbreite, Worttrennung von
  Programmierpraktikum bei 390/1280 px mit Systemschrift im Browser prüfen.

## C – Material 3 Expressive

- [x] Ring entfernt; Dringlichkeit über Gewicht ≤7 Tage, Containerfarbe ≤3 Tage.
- [x] Hero-Labels in Normalschreibung ohne Sperrung.
- [x] Eine Connected-Group-Komponente/Indikator für Theme, Typfilter, Zeitfenster
  und Vergangene. Theme-Radiogroup/Pfeiltasten und Vorab-Script bleiben bestehen.
- [x] Dekorative Rahmen entfernt. Funktionale Checkbox-/Kalenderbegrenzungen behalten;
  rechnerischer UI-Kontrast ≥3:1. Sichtbare Fokus-Outlines bleiben auch bei Auswahl.
- [x] Shape-Skala nur über Tokens. 32px-Hero −16px-Padding =16px für innere Reihen.
  Nullradien an fortlaufenden Kalenderbändern bleiben eine geometrische Ausnahme.
- [x] M3-Typografierollen; eine dokumentierte dichte Label-Medium-Zeilenhöhe in den
  44px-Zeitstrahlbuttons. Keine freien Komponenten-Font-Shorthands.
- [x] Farbwerte nur in Palette/Datensätzen. SVG-Alpha-Masken verwenden weiter Weiß.
- [x] `motion.js`, Spatial-/Effects-Federn, Unterbrechung und Live Reduced Motion erhalten.
  Keine neuen Laufzeit-Abhängigkeiten, kein Build, kein dauerhaftes `will-change`.
- [ ] Hell/Dunkel/System und Reduced Motion im echten Browser abnehmen; keine
  visuellen oder Performance-Erfolge aus den Node-Checks ableiten.

## Verifikation

Ausgang: 44/44 Node-Tests. Nach A und B: je 38/38 (alte Scroll-/Entzerrungstests
ersetzt). Nach C: 40/40 einschließlich zwei zusätzlicher Kontrastprüfungen;
CSS-Scanner: 3/3. Playwright erkennt 372 Fälle in fünf Spec-Dateien.
Je Phase wurde ein Chromium-Fall gestartet; alle drei scheitern vor dem Seitenaufruf
an fehlenden Browser-Binaries. Download HTTP 403; Cloud-Vorschau ebenfalls blockiert.
Kein Screenshot-Baseline-Update, keine visuellen Messwerte, kein Performance-Trace.

Vollständiger Bericht: [verification-report.md](verification-report.md).
Browserbefehle: [visual-tests.md](visual-tests.md).
