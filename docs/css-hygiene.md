# CSS-Hygiene und Verifikation

Die Kaskade ist in `@layer base, components, expressive, motion` geordnet:

- `base`: Farb-/Abstands-/Typografie-Tokens, Reset und Dokumentfläche.
- `components`: Komponentengeometrie, tonale Flächen und ihre Responsive-/Statusregeln.
- `expressive`: variable Typografie einschließlich aller spezifischen Zustandsgewichte.
- `motion`: Federkurven, Übergänge, View Transitions und Reduced Motion.

26 mehrfach definierte, unbedingte Komponentenselektoren sind an ihrem ersten
Standort konsolidiert. Bedingte Overrides bleiben in ihrem Kontext. Shorthands
stehen vor weiter wirksamen Longhands; mobiler Karten-/Hero-Padding bleibt später.
Die `.hero-number` erhält genau eine Größe im Font-Shorthand. Tote Checkbox-
Pseudo-Regeln entfallen zugunsten des vorhandenen SVG-Häkchens. Unbenutzte Tokens
wurden vor dem Entfernen gegen CSS, HTML und sämtliche Anwendungs-JS-Dateien
geprüft. Dynamisch adressierte Motion-Tokens bleiben erhalten.

Der Scanner zählt im Phase-2-Stand 99 wiederholte Einzelselektoren, nach dieser
Bereinigung 92. Wiederholungen über Layer, Media, Container Queries, Supports
oder Zustandsselektoren sind bewusste Ergänzungen, keine pauschal löschbaren Regeln.
Der frühere 64-KB-Bericht `docs/css-duplicate-inventory.md` ist entfernt und
ignoriert; das Skript erzeugt das Inventar weiterhin bei Bedarf.

## Inventar reproduzieren

```bash
node scripts/css-duplicates.mjs css/styles.css > /tmp/css-duplicates.json
node scripts/css-hygiene-report.mjs css/styles.css > /tmp/css-duplicate-inventory.md
node --test scripts/css-duplicates.test.mjs
TZ=Europe/Berlin node --test tests/
```

Der Bericht verwendet aktuelle Zeilen und Kontexte. Er enthält keine alten
hartcodierten PR-B-Zielzeilen und darf nicht als automatischer Löschplan gelten.

## Browserprüfung

Die bisherigen visuellen Testfälle und `tests/visual/compare-css.mjs` bleiben
verfügbar. Der exakte Vergleich erfasst alle Computed Styles, Custom Properties
und PNG-Bytes; bewusst entfernte Tokens, die korrigierte Icon-Rotation und die
neue Transform-Wellenphase erzeugen dabei erwartete Abweichungen. Daher sind
für den reinen Kaskadenvergleich gleiche Theme-/Wellenregeln und ein getrenntes
CSS-Paar erforderlich. Kein pauschaler Gleichheitsnachweis für Phase 2 → 3.

22 Node-Regressionen und 3 Scanner-Tests bestanden; Syntax und Whitespace geprüft.
**Nicht visuell verifiziert:** Browser-Binaries fehlen, Download HTTP 403.
Offen sind visuelle Gleichheit der übrigen Komponenten, alle fünf Breiten in
Hell/Dunkel/System, reale Reduced-Motion-Emulation sowie ein Performance-Trace
der neuen Wellenphase. Transform statt vererbter Property beseitigt deren
animierte Style-Vererbung; ein tatsächlicher Compositor-/60-fps-Nachweis wird
hier nicht behauptet.
