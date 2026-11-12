# Einstellungsmenü: Verhalten und Abnahme

Basis: `main` = `2b737dc`, mit gemergtem AP5. Branch:
`feat/einstellungsmenue`. Der neue Auftrag verschiebt die Semesterwahl bewusst
aus der Kopfzeile in die Einstellungen; die AP5-URL- und Archivlogik bleibt erhalten.

## Verhalten und Entscheidungen

- Das 44×44px-Zahnrad steht direkt neben dem Theme-Schalter. Es öffnet einen
  nativen, benannten `dialog` mit Semesterwahl und „Kalenderexport anzeigen“.
  Die Semesterzeile im Kopf zeigt nur noch den Namen; außerhalb des Menüs gibt
  es keine weiteren Steuerelemente für diese beiden Einstellungen.
- Die Semesterwahl verwendet weiterhin alle Einträge aus `SEMESTERS`, validierte
  URL-IDs und `history.replaceState`. Nach dem Wechsel bleibt der Fokus am Select
  im Menü. Beim Schließen per Schaltfläche, Escape oder Hintergrundklick kehrt
  er zum Zahnrad zurück. Tab und Shift+Tab bleiben innerhalb der drei Menüfelder.
- Die Exportanzeige ist standardmäßig eingeschaltet, um das vorhandene Verhalten
  zu erhalten. `calendar_export_visible_v1` speichert nur diese Sichtbarkeit.
  Die Semesterwahl wird weiterhin nicht lokal gespeichert. Erledigt-IDs und
  Termine werden durch die Anzeigeeinstellung nicht verändert.
- Ausblenden betrifft den Gesamtexport einschließlich Deaktivierungsgrund und
  die Exportbuttons aller Karten. CSS entfernt sie auch aus der Tastatur- und
  Accessibility-Navigation; neu gerenderte Karten respektieren dieselbe Einstellung.
  Karten-Markup, Exportinhalt und Downloadlogik bleiben unverändert.
  Die Regel gilt auch für temporäre Animationskopien außerhalb des Listencontainers.
- Die gespeicherte Sichtbarkeit wird schon vor dem Stylesheet gesetzt, damit der
  Gesamtexport beim Reload nicht kurz sichtbar wird. Bei gesperrtem oder vollem
  Speicher bleibt das Umschalten auf der aktuellen Seite möglich.
- Der Dialog nutzt M3-Rollen, einen Scrim-Token, sichtbare Fokusrahmen, native
  Formularelemente und umbruchfähige Texte. Keine zusätzlichen Abhängigkeiten,
  Frameworks oder Builds; keine Änderungen unter `.github/` oder an den Daten.

## Browseraufbau und Iterationen

Playwright 1.62.1 mit vorhandenem Chromium 151.0.7922.34, Windows, Locale de-DE,
Europe/Berlin, DPR 1. Python3 war bereits als nicht ausführbarer Store-Verweis
nachgewiesen; der vorhandene Node-HTTP-Server stellt dieselben statischen Dateien
bereit. Server und Browser wurden wegen der Sandbox-Socket-Sperre im freigegebenen
Prozesskontext gestartet. Die Browser-Version und Paketdateien bleiben unverändert.

Vor der ersten Änderung wurden 375×812 hell und 1200×900 dunkel aufgenommen und
angesehen. Nach dem Einbau folgten offene/geschlossene Menüs und ausgeblendete
Exporte in denselben Ansichten. Der dunkle Hintergrund wurde auf einen eigenen
Scrim-Token korrigiert und erneut angesehen. Die Tastaturmessung zeigte beim
nativen Tab-Umbruch kurz `body` als aktives Element; ein begrenzter Tab-Handler
schließt diese Lücke in beiden Richtungen. Der achtteilige gezielte Lauf besteht
danach einschließlich Touch, Speicherblockade, früher Präferenz und 200 % Text.

Zwei zusätzliche Regressionstests haben das Wiederauftauchen eines Exportbuttons
in einer temporären Kartenkopie während der Fallback-Filteranimation belegt. Die
CSS-Regel erfasst deshalb auch Kopien außerhalb von `#list`; beide Themes werden
mit tatsächlich vorhandenen Animationskopien geprüft, nicht nur nach deren Ende.

Die bestehenden AP5-Tests öffnen nun für Änderungen ausdrücklich das Menü.
Auf der geschlossenen Seite erwarten sie das Zahnrad statt des Selects in der
Tab-Reihenfolge. Die Kollisionsprüfung vergleicht im Modal nur Bedienelemente
seiner eigenen Interaktionsebene: Der native Dialog überlagert den inerten
Seitenhintergrund absichtlich. Alle fachlichen Semester-/Archiv-Assertions und
Bildreferenzen bleiben erhalten. Diese Anpassungen sind im Test-Commit begründet.

## Pflichtprüfungen

```text
TZ=Europe/Berlin node --test tests/
tests 95; pass 95; fail 0; skipped 0

node --test scripts/css-duplicates.test.mjs
tests 3; pass 3; fail 0; skipped 0
```

Vier neue Unit-Tests prüfen Vorgabe/ungültige Werte, Speichern und erneutes
Einblenden, Speicherfehler sowie die frühe Anwendung vor dem Stylesheet.
Sommer-Fingerprint, A/B-, Occurrence-, Semester- und Archivtests bestehen.

## Abschlusslauf und Messwerte

**224/224 Browserfälle bestanden**, keine fehlgeschlagenen oder übersprungenen
Fälle im Abschlusslauf (5,6 Minuten): 46 neue Einstellungsfälle, 159 angepasste
AP5-Fälle, zwei bestehende ICS-/Raumfälle, drei Theme-/Tastaturfälle und 14
bestehende AP3-Interaktionsfälle. Die neuen Menüfälle enthalten **158 gemessene
Zustände, 102 Screenshots und 168 geprüfte Tabstopps**. Gemessen wurden dort
**0 Browser-Konsolenfehler/-warnungen, 0 horizontale Überläufe, 0 Ziele unter
44×44px und 0 erfasste Zeitstrahl-Labelüberschneidungen**. Der niedrigste Kontrast
der neuen Texte und Symbole beträgt **7,22:1**.

| Dimension | Tatsächlich geprüft |
| --- | --- |
| Viewports | 320×640, 375×812, 600×900, 840×900, 1200×900, 1600×1000, 2300×1200 |
| Menü-Matrix | 11.11.2026, jede Breite × Hell/Dunkel × normale/reduzierte Bewegung; geschlossen, offen, Export ausgeblendet mit Reload, wieder eingeblendet und Archiv nach Wechsel/Reload |
| Systemmodus | Alle sieben Breiten, lebender Wechsel zwischen emuliertem Dunkel und Hell im offenen Menü |
| Datenregression | AP5-Tage 11.11., 15.12., 18.12.2026; 16.02., 17.02., 18.02., 01.03., 08.04.2027; zusätzlich 10./11.11. und Mitternachtstimer mit offenem Menü |
| Bedienung | Enter, Tab/Shift+Tab in beiden Richtungen, Space, Escape, Schließen und Hintergrundklick; Fokus nach Semesterwechsel und Rückkehr zum Zahnrad |
| Speicherung | Reload, neuer Browserkontext mit Standardwert, gesperrter Speicher und verzögertes App-Modul ohne Export-Aufblitzen; Erledigt-IDs bleiben erhalten |
| Export/Animation | Gesamtexport und Kartenexport ein/aus, Filter-Neurendern, echte ICS-Downloads, Fallback-Animation in beiden Themes mit tatsächlich vorhandenen Kopien |
| Touch/Textgröße | Emuliertes Touch-Tippen auf Zahnrad, Checkbox und Schließen in beiden Themes; Dialog mit 200 % Text ohne eigenen horizontalen Überlauf |

Repräsentative Abschlussbilder des offenen Menüs wurden für alle sieben Breiten
und beide Paletten angesehen; mobile Vorher/Nachher-Bilder mit ausgeblendeten
Exportaktionen ebenfalls. Nur repräsentative Bilder wurden manuell angesehen,
alle Messzustände automatisiert geprüft.

```text
settings.spec.mjs / archive.spec.mjs / ICS / Theme / AP3 interactions
224 passed (5.6m)
```

## Inhaltsvergleich

Der bestehende `archive-check.mjs --smoke` lief bei 375×812 und 1200×900 in Hell
und Dunkel am 11.11.2026 gegen die unveränderten lokalen AP5-Referenzen.
Alle vier Übersichten und vier vollständigen Terminlisten haben **0 abweichende
RGBA-Pixel**; die Übersichtpositionen sind exakt gleich. Der zusätzliche Menüknopf
und der entfernte Auswahlpfeil im Header sind die beabsichtigten Änderungen und
liegen außerhalb dieser Inhaltsbilder. Ausgeblendete Exporte verändern die Liste
absichtlich. Keine Bildreferenz wurde angelegt, ersetzt oder aktualisiert.

## Grenzen und Folge-Vorschläge

Die gesamte Bestandssuite bleibt wegen ihrer bereits dokumentierten fehlenden
Screenshotreferenzen nicht grün. Ein erneuter Versuch mit unveränderten Referenzen
und `--max-failures=5` ergab **236 bestanden, fünf fehlgeschlagen, einen durch die
Fehlergrenze unterbrochenen Fall und 523 nicht ausgeführte Fälle**. Alle fünf
Fehler betreffen fehlende `dashboard.png`-Referenzen. Der zusätzliche globale
Runner-Hinweis benennt ausschließlich das Erreichen der gewählten Fehlergrenze.
Keine Assertions wurden dafür abgeschwächt und keine Referenzen automatisch erzeugt.

Ein vorheriger, noch nicht abschließender 222er-Lauf hatte einen Tooltip-Hover-
Timeout bei AP3/320px dunkel. Derselbe Test und alle 14 AP3-Interaktionsfälle
bestanden im vollständigen Abschlusslauf unverändert. Die Ursache dieses
zeitabhängigen Zwischenbefunds ist nicht abschließend geklärt.

Der vorhandene `ux-check.mjs` lief am Endstand zusätzlich bei 320×640 dunkel,
Reduced Motion am 18.02.2027 und 1200×900 hell, normale Bewegung am 11.11.2026:
keine Konsolenmeldungen, `scrollWidth = innerWidth`, keine kleinen Ziele oder
Labelüberschneidungen; Kontrast am Zahnrad 7,22:1 beziehungsweise 9,38:1.

Firefox, WebKit, physische Geräte und ein akustischer Screenreader-Test wurden
bewusst ausgelassen. Der 200-%-Test prüft den Dialog ohne eigenen horizontalen
Überlauf, nicht sämtliche unveränderten Seitenkomponenten bei dieser Textgröße.
Die native Optionsliste folgt dem Browserdesign. Die bekannten Baselines und
technischen Bestandsfehler bleiben getrennte Folgearbeit.

Screenshots, Messungen, Logs und temporäre Runner-Konfigurationen liegen im
ignorierten `test-results/settings/` und werden nicht committet.
