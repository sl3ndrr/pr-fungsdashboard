# PR A – Review und offene Browser-Abnahme

Implementierung aufgrund ausdrücklicher Freigabe ohne Vorab-Reproduktion.
Die Ursachen unten sind Codebefunde, keine bestätigten DevTools-Befunde.
Keine Vorher-/Nachher-Screenshots wurden erstellt oder fingiert: lokale Browser-
Binaries fehlen; die Cloud-Vorschau meldete `ERR_BLOCKED_BY_CLIENT`.

| Fix | Codebefund / Entscheidung und Änderung | Bewusst unverändert | Screenshots / Browser-Abnahme |
| --- | --- | --- | --- |
| 1 | `scaleX` stauchte die Masken; nur die Füllung hatte eine laufende Phase. Jetzt Clip-Path und eine vererbte registrierte `--wave-shift`-Phase für beide Layer. Die Zeitstrahl-Pille ändert Breite statt Endkappen zu skalieren. | 24-px-Maske, Amplitudenblendung, Spatial-slow, Reduced Motion, ARIA. | Offen: 0/3/50/76 (25/33)/97/100 %, 400 % Zoom, eingefrorene Animation bei 0/600/1300 ms; Hero und Statistik, Chromium/Firefox/WebKit. |
| 2 | `--surface-1` erzeugte eine andere Fläche als die Karte. Transparenter Hintergrund, `--on-surface` auf `--surface-container-low`; horizontal begrenzte Labels. Tooltips enden oberhalb beider Labelzeilen; ihre Höhe bekommt Platz im Scroller. Der Akzent links bleibt zur Zuordnung zum Band erhalten. | Zeitraum-Bänder, Monatsmarken, Daten. | Offen: Hell/Dunkel, Randlabels, `data-row="1"`, Rail/Punkte/Heute/Tooltip und Wiederholung nach 4b. |
| 3 | Allgemeine Countdown-Mindesthöhe von 88 px und Spaltenlayout wirkten auch auf Textstatus. Textvarianten bekommen intrinsische Größe, Info und Status können nebeneinander stehen und umbrechen. | Zahlen-Countdown bleibt mindestens 88 px; ursprüngliches Padding. | Offen: 360/768/1280/1600 px; Abgebrochen (Zwischenstand), Erledigt, Abgelaufen, Heute, Zahlen; beide Themes. |
| 4a | Hohler Punkt wird als „Abgebrochen“ erklärt, mit denselben Border-/Background-Regeln wie der echte Punkt. Status ist von Typen/Zeiträumen gruppiert, „Heute“ ist ein eigener Strich. Der Punktname nennt bereits Status und Datum. | Punktpositionen und Hitflächen. | Offen: 360 px und beide Themes. |
| 4b | Gruppenlabels und Striche entfallen; Datum bleibt im Namen/Tooltip jedes Punkts. Fokus zeigt Details, Escape schließt ohne Fokusverlust; Touch: zuerst Details, dann Navigation. | Monats-/Achsenlabels und Kollisionen. | Offen: Tastatur/Touch und Zeitraum-Kollisionen. |
| 4c | Startzentrierung über ausschließlich `scrollLeft`, sofort und begrenzt. Fonts/Resize dürfen nachmessen; eigene Bedienung beendet jede automatische Korrektur. Tageswechsel und normale Render zentrieren nicht erneut. | Seitenposition, Reduced-Motion-Scroll zur Zielkarte. | Offen: 360/1600 px, Fonts, Randtage, eigene Scrollposition. |
| 5 | Optionaler Datenwert `cancelReason`, sicher escaped wie andere Datenfelder, neutraler Fallback „Abgebrochen“. Kompakter Meta-Chip statt Kachel, zusätzlich nur Titelstrike. Keine besondere Dämpfung der gesamten abgebrochenen Karte. Tooltip nennt Status und ggf. Grund. | `js/data.js` vollständig unverändert; Done-/Expired-Badges. | Offen: Chip und Tooltips in beiden Themes; Grund/Fallback. |
| 6a | Codebefund: Inline-Ziffernreels und zusätzlicher Unit-Margin, auf Mobilgeräten außerdem Row-Layout. Flex-Zahl, kein Unit-Margin, auch mobil untereinander; Singular „1 Tag“. | Allgemeine Zahlen-Mindesthöhe 88 px, Countdown-Reels. | Offen: 1/6/12/Heute, Hell/Dunkel. |
| 6b | Keine Prozentzahl: Resttage neben Tag/Total und in `aria-valuetext`; Singular und letzter Tag, niemals negativer Rest. | Statistiktexte und übrige ARIA-Werte. | Offen: 8/1/0 Resttage, beide Themes. |
| 6c | „Danach“ war bereits ein echter Button. Hover/Fokus/Press-State-Layer verdeutlichen ihn; eigene Übergänge sind Effects. Datum mit Wochentag über Intl und bestehende lokale Datumslogik. Zielkarte erhält Fokus. | Typfilter-Freigabe und Scrolllogik inkl. Reduced Motion. | Offen: Tab/Enter/Space, sichtbarer Fokus, Hover-Geräte, Touch. |

## Input für PR C: überschattete CSS-Deklarationen

Gefunden u. a. bei `.mini-progress` (Höhe/Hintergrund/Overflow),
`.mini-progress span` (Höhe/Hintergrund), `.stat-tile .mini-progress span` und
`.hero-period .mini-progress span` (durch transparent `!important`),
`.timeline-period-label` (Textfarbe), `.timeline-tooltip` (Display),
`.timeline-track::before` (Hintergrund), `.hero-number` (Font-Size), `.hero`,
`.card`, `.card:hover`, `.countdown` (Transition), `.theme-switch`,
`.theme-switch-thumb` und `.page-header`. In A wurden diese nicht pauschal
aufgeräumt. Nur die durch Fix 5 obsolete Abgebrochen-Kachel wurde entfernt.
PR C bereinigt ausschließlich nachgewiesene Deklarationen, ohne Regeln zu verschieben.

## Abgebrochene Termine ohne Grund

- `p4`: Theorie 2 – 05.10.2026, 10:00 Uhr. Kein `cancelReason` gesetzt.

## Prüfstatus

Node-Tests (inkl. Fallback/Grund, Resttagen, ungeometrisch skalierter Füllung),
ES-Modul-Syntax und `git diff --check` werden vor Erstellung geprüft.
Die Palette der Label- und Chip-Texte ist rechnerisch AA-geprüft gegen die
verwendeten Container. Visuelle Kontraste, Fonts, vollständige Tastatur-/ARIA-
Abnahme, echte Reduced-Motion-Emulation und Screenshots bleiben offen.
PR B stellt dafür reproduzierbare Browser- und Screenshot-Tests bereit.
