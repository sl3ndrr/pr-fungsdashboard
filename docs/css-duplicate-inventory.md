# CSS-Duplikate: vollständiges Inventar aus PR B

Automatisch erzeugt mit `node scripts/css-hygiene-report.mjs <PR-B-styles.css>`.
108 mehrfach vorkommende Einzelselektoren, 275 Fundstellen. Selektorlisten werden außerhalb von Klammern/Strings geteilt; Media, Supports und Starting Style werden mit Kontext erfasst. Keyframe-Offsets und Property-Deskriptoren sind keine Selektoren. Zeilen beziehen sich auf B.

„Teilweise“ nennt jede entfernte Property samt späterem Gewinner. Restdeklarationen werden an den angegebenen Zielstellen zusammengeführt, soweit die dazwischenliegende Kaskade dies erlaubt. Verbleibende Basis-/Gruppenregeln sind bewusste Ergänzungen oder Überschreibungen; ihr Standort bleibt erhalten. Der Bericht ersetzt keinen Browservergleich.

| Selektor | Zeile / Kontext | Klassifikation und Aktion | Bewusst verbleibend / Grund |
| --- | --- | --- | --- |
| `:root` | 2 | Bewusste Ergänzung/Überschreibung: behalten | color-scheme, --primary, --on-primary, --primary-container, --on-primary-container, --secondary, --on-secondary, --secondary-container, --on-secondary-container, --tertiary, --on-tertiary, --tertiary-container, --on-tertiary-container, --error, --on-error, --error-container, --on-error-container, --surface, --surface-container-lowest, --surface-container-low, --surface-container, --surface-container-high, --surface-container-highest, --on-surface, --on-surface-variant, --outline, --outline-variant, --shape-xs, --shape-sm, --shape-md, --shape-lg, --shape-lg-inc, --shape-xl, --shape-xl-inc, --shape-xxl, --shape-full, --radius-sm, --radius-md, --radius-lg, --radius-pill, --space-1, --space-2, --space-3, --space-4, --space-6, --space-8, --space-12, --font-body, --font-display, --type-display-large, --type-display-medium, --type-display-small, --type-headline-large, --type-headline-medium, --type-headline-small, --type-title-large, --type-title-medium, --type-title-small, --type-body-large, --type-body-medium, --type-body-small, --type-label-large, --type-label-medium, --type-label-small, --weight-display, --weight-title, --weight-emphasized, --font-xs, --font-sm, --font-md, --font-lg, --font-xl, --font-2xl, --state-hover, --state-focus, --state-pressed, --state-disabled-content, --state-disabled-container, --surface-0, --surface-1, --surface-2, --bg, --card, --card-done, --border, --control-border, --text, --text-muted, --text-faint, --pruefung, --pruefung-bg, --abgabe, --abgabe-bg, --termin, --termin-bg, --urgent, --done, --period-ink, --rail-past, --shadow-1, --shadow-2, --shadow, --duration-fast, --duration-normal, --duration-entry, --ease; getrennte Token-Familien und Feature-/Motion-Fallbacks; keine neuen Token |
| `:root` | 497 | Bewusste Ergänzung/Überschreibung: behalten | --spring-spatial-fast, --spring-spatial, --spring-effects, --dur-spatial-fast, --dur-spatial, --dur-spatial-slow, --dur-effects-fast, --dur-effects, --dur-effects-slow; getrennte Token-Familien und Feature-/Motion-Fallbacks; keine neuen Token |
| `:root` | 505 / `@supports not (transition-timing-function: linear(0,1))` | Bewusste Ergänzung/Überschreibung: behalten | --spring-spatial-fast, --spring-spatial, --spring-effects; bedingt: @supports not (transition-timing-function: linear(0,1)) |
| `:root` | 533 | Bewusste Ergänzung/Überschreibung: behalten | view-transition-name; getrennte Token-Familien und Feature-/Motion-Fallbacks; keine neuen Token |
| `:root` | 598 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | --dur-effects-fast, --dur-effects, --dur-effects-slow; bedingt: @media (prefers-reduced-motion: reduce) |
| `*` | 48 | Bewusste Ergänzung/Überschreibung: behalten | box-sizing, margin, padding; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `*` | 599 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | scroll-behavior, transition-property, transition-duration, transition-timing-function; bedingt: @media (prefers-reduced-motion: reduce) |
| `body` | 62 | Teilweise überschrieben: löschen transition → 508; Rest am Ort behalten | background-color, color, font-family, padding, min-height, line-height, -webkit-tap-highlight-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `body` | 447 | Bewusste Ergänzung/Überschreibung: behalten | font-optical-sizing; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `body` | 508 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.container` | 74 | Bewusste Ergänzung/Überschreibung: behalten | max-width, margin, position; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.container` | 255 / `@media (min-width: 1560px)` | Bewusste Ergänzung/Überschreibung: behalten | max-width; bedingt: @media (min-width: 1560px) |
| `.page-header` | 76 | Teilweise überschrieben: löschen justify-content → 400, gap → 400, margin-bottom → 400; Rest → 400 | display, align-items, flex-wrap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.page-header` | 400 | Bewusste Ergänzung/Überschreibung: behalten | justify-content, gap, margin-bottom; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.page-header` | 406 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | gap; bedingt: @media (max-width: 480px) |
| `.theme-switch` | 90 | Teilweise überschrieben: löschen background → 470, box-shadow → 470, transition → 508; Rest am Ort behalten | position, display, box-sizing, width, height, padding, border, border-radius; gemeinsamer Control-Rand, Tonalfläche und Motion; Reihenfolge der Border-Shorthands bewahren |
| `.theme-switch` | 426 | Bewusste Ergänzung/Überschreibung: behalten | border-color; gemeinsamer Control-Rand, Tonalfläche und Motion; Reihenfolge der Border-Shorthands bewahren |
| `.theme-switch` | 470 | Bewusste Ergänzung/Überschreibung: behalten | background, box-shadow; gemeinsamer Control-Rand, Tonalfläche und Motion; Reihenfolge der Border-Shorthands bewahren |
| `.theme-switch` | 508 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsamer Control-Rand, Tonalfläche und Motion; Reihenfolge der Border-Shorthands bewahren |
| `.theme-switch-thumb` | 104 | Teilweise überschrieben: löschen background → 471, transition → 509; Rest am Ort behalten | position, top, left, width, height, border-radius, box-shadow, pointer-events; Border-Shorthand vor späterer border-color; gemeinsamer Control-Rand und Motion getrennt |
| `.theme-switch-thumb` | 440 | Bewusste Ergänzung/Überschreibung: behalten | border; Border-Shorthand vor späterer border-color; gemeinsamer Control-Rand und Motion getrennt |
| `.theme-switch-thumb` | 471 | Bewusste Ergänzung/Überschreibung: behalten | background, border-color; Border-Shorthand vor späterer border-color; gemeinsamer Control-Rand und Motion getrennt |
| `.theme-switch-thumb` | 509 | Bewusste Ergänzung/Überschreibung: behalten | transition; Border-Shorthand vor späterer border-color; gemeinsamer Control-Rand und Motion getrennt |
| `.theme-option` | 121 | Teilweise überschrieben: löschen transition → 510; Rest am Ort behalten | position, z-index, flex, display, place-items, width, height, padding, border, border-radius, background, color, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.theme-option` | 510 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.theme-option svg` | 138 | Bewusste Ergänzung/Überschreibung: behalten | display, width, height; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.theme-option svg` | 511 | Bewusste Ergänzung/Überschreibung: behalten | rotate, scale, transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.theme-option svg` | 601 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | scale, rotate; bedingt: @media (prefers-reduced-motion: reduce) |
| `.theme-option:hover` | 144 | Bewusste Ergänzung/Überschreibung: behalten | transform; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.theme-option:hover` | 600 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | transform; bedingt: @media (prefers-reduced-motion: reduce) |
| `.theme-option:active` | 145 | Bewusste Ergänzung/Überschreibung: behalten | transform; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.theme-option:active` | 600 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | transform; bedingt: @media (prefers-reduced-motion: reduce) |
| `.theme-option:focus-visible` | 146 | Vollständig überschrieben: löschen (outline → 495, outline-offset → 495) | — |
| `.theme-option:focus-visible` | 495 | Bewusste Ergänzung/Überschreibung: behalten | outline, outline-offset; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.top-grid` | 163 | Bewusste Ergänzung/Überschreibung: behalten | display, grid-template-columns, gap, margin-bottom; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.top-grid` | 164 / `@media (min-width: 880px)` | Bewusste Ergänzung/Überschreibung: behalten | grid-template-columns, align-items; bedingt: @media (min-width: 880px) |
| `.top-grid` | 256 / `@media (min-width: 1560px)` | Bewusste Ergänzung/Überschreibung: behalten | grid-template-columns; bedingt: @media (min-width: 1560px) |
| `.hero` | 167 | Teilweise überschrieben: löschen background → 449, border → 449, border-radius → 449; Rest am Ort behalten | padding, display, flex-direction, align-items, gap, box-shadow, min-width; Basis-Padding bleibt vor der mobilen Regel; Tonalfläche und Motion separat |
| `.hero` | 198 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | padding; bedingt: @media (max-width: 480px) |
| `.hero` | 449 | Bewusste Ergänzung/Überschreibung: behalten | background, color, border, border-radius, min-height; Basis-Padding bleibt vor der mobilen Regel; Tonalfläche und Motion separat |
| `.hero` | 508 | Bewusste Ergänzung/Überschreibung: behalten | transition; Basis-Padding bleibt vor der mobilen Regel; Tonalfläche und Motion separat |
| `.hero.imminent` | 169 | Teilweise überschrieben: löschen background → 451; Rest am Ort behalten | border-top-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero.imminent` | 451 | Bewusste Ergänzung/Überschreibung: behalten | background, color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-main` | 171 | Bewusste Ergänzung/Überschreibung: behalten | display, align-items, gap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-main` | 198 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | flex-direction, align-items, gap; bedingt: @media (max-width: 480px) |
| `.hero-countdown` | 172 | Bewusste Ergänzung/Überschreibung: behalten | flex-shrink, display, flex-direction, min-width, font-variant-numeric; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-countdown` | 198 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | flex-direction, align-items, gap; bedingt: @media (max-width: 480px) |
| `.hero-number` | 173 | Teilweise Ergänzung: zusammenführen → 453 | font, letter-spacing; font-Shorthand liefert Familie/Gewicht; spätere Größe/Variation übersteuern nur Teilwerte |
| `.hero-number` | 453 | Bewusste Ergänzung/Überschreibung: behalten | display, line-height, font-variation-settings, font-size, min-width; font-Shorthand liefert Familie/Gewicht; spätere Größe/Variation übersteuern nur Teilwerte |
| `.hero.imminent .hero-number` | 176 | Bewusste Ergänzung/Überschreibung: behalten | color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero.imminent .hero-number` | 454 | Bewusste Ergänzung/Überschreibung: behalten | font-variation-settings; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-title` | 178 | Bewusste Ergänzung/Überschreibung: behalten | font, margin-top, overflow-wrap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-title` | 455 | Bewusste Ergänzung/Überschreibung: behalten | font-variation-settings; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-next` | 183 | Teilweise überschrieben: löschen border-radius → 456; Rest am Ort behalten | display, align-items, gap, width, min-height, border, background, color, font, text-align, cursor, padding; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-next` | 456 | Bewusste Ergänzung/Überschreibung: behalten | padding-inline, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-next` | 517 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-next-days` | 187 | Bewusste Ergänzung/Überschreibung: behalten | font-size, color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-next-days` | 188 | Bewusste Ergänzung/Überschreibung: behalten | text-align, flex; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress` | 190 | Teilweise überschrieben: löschen height → 550, background → 550, overflow → 550; Rest → 550 | border-radius, margin-top; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress` | 428 | Vollständig überschrieben: löschen (background → 550, outline → 550) | — |
| `.mini-progress` | 550 | Bewusste Ergänzung/Überschreibung: behalten | --wave-amplitude, --wave-shift, animation, --progress-color, --progress-track, position, height, background, outline, overflow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress` | 602 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | animation-play-state; bedingt: @media (prefers-reduced-motion: reduce) |
| `.mini-progress span` | 191 | Teilweise überschrieben: löschen height → 551, background → 551; Rest → 551 | display, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress span` | 530 | Teilweise Ergänzung: zusammenführen → 551 | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress span` | 551 | Bewusste Ergänzung/Überschreibung: behalten | position, inset, width, height, background, overflow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.hero-period .mini-progress span` | 192 | Vollständig überschrieben: löschen (background → 444) | — |
| `.hero-period .mini-progress span` | 444 | Vollständig überschrieben: löschen (background → 551 (!important)) | — |
| `.type-icon` | 194 | Teilweise überschrieben: löschen border-radius → 465; Rest am Ort behalten | display, place-items, width, height, flex; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.type-icon` | 465 | Bewusste Ergänzung/Überschreibung: behalten | border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-card` | 201 | Teilweise überschrieben: löschen background → 457, border → 457, border-radius → 457; Rest am Ort behalten | padding, display, flex-direction, justify-content, box-shadow, min-width, position; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-card` | 235 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | padding; bedingt: @media (max-width: 480px) |
| `.timeline-card` | 457 | Bewusste Ergänzung/Überschreibung: behalten | background, border, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-track::before` | 205 | Teilweise überschrieben: löschen background → 564; Rest am Ort behalten | content, position, top, left, right, height, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-track::before` | 564 | Bewusste Ergänzung/Überschreibung: behalten | background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-progress` | 206 | Bewusste Ergänzung/Überschreibung: behalten | position, left, top, height, background, border-radius, z-index; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-progress` | 531 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-period-span` | 207 | Bewusste Ergänzung/Überschreibung: behalten | position, top, height, background, border-radius, pointer-events; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-period-span` | 442 | Bewusste Ergänzung/Überschreibung: behalten | box-shadow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-period-label` | 208 | Teilweise überschrieben: löschen color → 427, white-space → 427; Rest → 427 | position, top, transform, font-size, background, border-left, padding-left, font-weight; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-period-label` | 427 | Bewusste Ergänzung/Überschreibung: behalten | color, max-width, white-space, overflow-wrap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot` | 210 | Teilweise überschrieben: löschen background → 565, box-shadow → 565; Rest am Ort behalten | position, top, width, height, margin-left, padding, border, border-radius, cursor, z-index, color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot` | 565 | Bewusste Ergänzung/Überschreibung: behalten | scale, background, border-color, box-shadow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot::before` | 211 | Teilweise überschrieben: löschen width → 567, margin-left → 567; Rest → 567 | content, position, height, left, top, margin-top; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot::before` | 567 | Bewusste Ergänzung/Überschreibung: behalten | width, margin-left; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot.cancelled` | 214 | Teilweise überschrieben: löschen background → 566, border → 566; Rest am Ort behalten | box-shadow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot.cancelled` | 566 | Bewusste Ergänzung/Überschreibung: behalten | border, background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot:focus-visible` | 215 | Bewusste Ergänzung/Überschreibung: behalten | z-index; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot:focus-visible` | 383 | Bewusste Ergänzung/Überschreibung: behalten | outline, outline-offset; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-tooltip` | 218 | Teilweise überschrieben: löschen bottom → 573, display → 573; Rest am Ort behalten | position, left, transform, width, flex-direction, gap, padding, background, color, border, border-radius, box-shadow, font, text-align, pointer-events; Position/Fläche, Spatial/Effects sowie Reduced Motion bleiben getrennt |
| `.timeline-tooltip` | 573 | Bewusste Ergänzung/Überschreibung: behalten | bottom, display, visibility, opacity, scale, transform-origin, transition; Position/Fläche, Spatial/Effects sowie Reduced Motion bleiben getrennt |
| `.timeline-tooltip` | 601 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | scale, rotate; bedingt: @media (prefers-reduced-motion: reduce) |
| `.timeline-legend-cancelled` | 230 | Bewusste Ergänzung/Überschreibung: behalten | --type-color, width, height, flex-shrink, border-radius; Geometrie bleibt separat vom mit .timeline-point geteilten Status |
| `.timeline-legend-cancelled` | 570 | Bewusste Ergänzung/Überschreibung: behalten | border, background, box-shadow; Geometrie bleibt separat vom mit .timeline-point geteilten Status |
| `.scroll-hint` | 233 | Bewusste Ergänzung/Überschreibung: behalten | color, font-size, margin-top; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.scroll-hint` | 234 / `@media (min-width: 880px)` | Bewusste Ergänzung/Überschreibung: behalten | display; bedingt: @media (min-width: 880px) |
| `.stats-container` | 238 | Teilweise überschrieben: löschen display → 409, margin-bottom → 409; Rest → 409 | justify-content, align-items, flex-wrap, gap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stats-container` | 409 | Bewusste Ergänzung/Überschreibung: behalten | display, margin-bottom; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.section-title` | 239 | Bewusste Ergänzung/Überschreibung: behalten | font-size, font-weight, line-height, margin-bottom; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.section-title` | 455 | Bewusste Ergänzung/Überschreibung: behalten | font-variation-settings; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.pill` | 242 | Teilweise überschrieben: löschen background → 467, border → 467, color → 467, font-size → 405, padding → 405, min-height → 405, border-radius → 467, transition → 513; Rest am Ort behalten | font-family, font-weight, cursor, flex-shrink, box-shadow; gemeinsame Button-/Control-Regeln und mobile Overrides; Basis-Schrift und State-Layer getrennt |
| `.pill` | 396 | Bewusste Ergänzung/Überschreibung: behalten | display, align-items, justify-content, gap; gemeinsame Button-/Control-Regeln und mobile Overrides; Basis-Schrift und State-Layer getrennt |
| `.pill` | 405 | Bewusste Ergänzung/Überschreibung: behalten | min-height, font-size, padding; gemeinsame Button-/Control-Regeln und mobile Overrides; Basis-Schrift und State-Layer getrennt |
| `.pill` | 426 | Bewusste Ergänzung/Überschreibung: behalten | border-color; gemeinsame Button-/Control-Regeln und mobile Overrides; Basis-Schrift und State-Layer getrennt |
| `.pill` | 467 | Bewusste Ergänzung/Überschreibung: behalten | border-radius, background, color, border; gemeinsame Button-/Control-Regeln und mobile Overrides; Basis-Schrift und State-Layer getrennt |
| `.pill` | 513 | Bewusste Ergänzung/Überschreibung: behalten | position, --state-opacity, transition; gemeinsame Button-/Control-Regeln und mobile Overrides; Basis-Schrift und State-Layer getrennt |
| `.pill:active` | 244 | Bewusste Ergänzung/Überschreibung: behalten | transform; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.pill:active` | 600 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | transform; bedingt: @media (prefers-reduced-motion: reduce) |
| `.pill.active` | 245 | Teilweise überschrieben: löschen background → 468, color → 468; Rest am Ort behalten | border-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.pill.active` | 468 | Bewusste Ergänzung/Überschreibung: behalten | background, color, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.group-list` | 250 | Bewusste Ergänzung/Überschreibung: behalten | display, grid-template-columns, gap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.group-list` | 251 / `@media (min-width: 720px)` | Bewusste Ergänzung/Überschreibung: behalten | grid-template-columns; bedingt: @media (min-width: 720px) |
| `.group-list` | 252 / `@media (min-width: 1200px)` | Bewusste Ergänzung/Überschreibung: behalten | grid-template-columns; bedingt: @media (min-width: 1200px) |
| `.group-list` | 257 / `@media (min-width: 1560px)` | Bewusste Ergänzung/Überschreibung: behalten | grid-template-columns; bedingt: @media (min-width: 1560px) |
| `.card` | 259 | Teilweise überschrieben: löschen background → 461, border-radius → 461, transition → 508; Rest → 265 | position, min-width, border, border-left, padding, box-shadow; Basis bleibt vor dem mobilen Padding; Typ-/Past-/Done-/Hover-Regeln haben höhere Spezifität |
| `.card` | 265 | Bewusste Ergänzung/Überschreibung: behalten | display, flex-direction; Basis bleibt vor dem mobilen Padding; Typ-/Past-/Done-/Hover-Regeln haben höhere Spezifität |
| `.card` | 295 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | padding; bedingt: @media (max-width: 480px) |
| `.card` | 461 | Bewusste Ergänzung/Überschreibung: behalten | background, border-color, border-left-color, border-radius; Basis bleibt vor dem mobilen Padding; Typ-/Past-/Done-/Hover-Regeln haben höhere Spezifität |
| `.card` | 508 | Bewusste Ergänzung/Überschreibung: behalten | transition; Basis bleibt vor dem mobilen Padding; Typ-/Past-/Done-/Hover-Regeln haben höhere Spezifität |
| `.card:hover` | 261 | Teilweise überschrieben: löschen box-shadow → 462; Rest am Ort behalten | transform; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.card:hover` | 462 | Bewusste Ergänzung/Überschreibung: behalten | background, box-shadow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.card:hover` | 600 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | transform; bedingt: @media (prefers-reduced-motion: reduce) |
| `.card.done` | 262 | Bewusste Ergänzung/Überschreibung: behalten | background, box-shadow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.card.done` | 463 | Bewusste Ergänzung/Überschreibung: behalten | background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.card.done .title` | 263 | Bewusste Ergänzung/Überschreibung: behalten | color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.card.done .title` | 264 | Bewusste Ergänzung/Überschreibung: behalten | text-decoration; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.card.done .title` | 464 | Bewusste Ergänzung/Überschreibung: behalten | color, font-variation-settings; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.card.done .title` | 486 | Bewusste Ergänzung/Überschreibung: behalten | text-decoration, background-size; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.badge` | 269 | Teilweise überschrieben: löschen border-radius → 466; Rest am Ort behalten | font, padding, width; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.badge` | 396 | Bewusste Ergänzung/Überschreibung: behalten | display, align-items, justify-content, gap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.badge` | 466 | Bewusste Ergänzung/Überschreibung: behalten | border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.title` | 274 | Bewusste Ergänzung/Überschreibung: behalten | font, overflow-wrap; Font-/Background-Shorthands und späteres background-image; State-Regeln behalten ihre Spezifität |
| `.title` | 485 | Bewusste Ergänzung/Überschreibung: behalten | background, font-variation-settings; Font-/Background-Shorthands und späteres background-image; State-Regeln behalten ihre Spezifität |
| `.title` | 522 | Bewusste Ergänzung/Überschreibung: behalten | transition; Font-/Background-Shorthands und späteres background-image; State-Regeln behalten ihre Spezifität |
| `.title` | 606 | Bewusste Ergänzung/Überschreibung: behalten | background-image; Font-/Background-Shorthands und späteres background-image; State-Regeln behalten ihre Spezifität |
| `.countdown` | 279 | Teilweise überschrieben: löschen font-variant-numeric → 393; Rest → 483 | align-self, margin-top, text-align, display, flex-direction; gemeinsame tabular-nums-Regel und Effects/Spatial-Regel bleiben; Status ist spezifischer |
| `.countdown` | 393 | Bewusste Ergänzung/Überschreibung: behalten | font-variant-numeric; gemeinsame tabular-nums-Regel und Effects/Spatial-Regel bleiben; Status ist spezifischer |
| `.countdown` | 438 | Teilweise Ergänzung: zusammenführen → 483 | min-height, justify-content; gemeinsame tabular-nums-Regel und Effects/Spatial-Regel bleiben; Status ist spezifischer |
| `.countdown` | 483 | Bewusste Ergänzung/Überschreibung: behalten | border-radius; gemeinsame tabular-nums-Regel und Effects/Spatial-Regel bleiben; Status ist spezifischer |
| `.countdown` | 508 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame tabular-nums-Regel und Effects/Spatial-Regel bleiben; Status ist spezifischer |
| `.countdown .secondary` | 282 | Bewusste Ergänzung/Überschreibung: behalten | font-size, color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.countdown .secondary` | 283 | Bewusste Ergänzung/Überschreibung: behalten | margin-top; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle` | 289 | Bewusste Ergänzung/Überschreibung: behalten | display, align-items, gap, min-height, cursor, font-size, color, margin-top; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle` | 487 | Bewusste Ergänzung/Überschreibung: behalten | position; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle input` | 290 | Teilweise überschrieben: löschen border-radius → 488, transition → 524; Rest am Ort behalten | appearance, width, height, flex-shrink, border, background, display, place-content, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle input` | 488 | Bewusste Ergänzung/Überschreibung: behalten | border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle input` | 524 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle input::before` | 291 | Teilweise überschrieben: löschen content → 490; Rest am Ort behalten | width, height, clip-path, transform, background, transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle input::before` | 490 | Bewusste Ergänzung/Überschreibung: behalten | content; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle input:checked` | 292 | Teilweise überschrieben: löschen background → 489; Rest am Ort behalten | border-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.done-toggle input:checked` | 489 | Bewusste Ergänzung/Überschreibung: behalten | border-radius, background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.calendar-section` | 298 | Vollständig überschrieben: löschen (margin-bottom → 577) | — |
| `.calendar-section` | 577 | Bewusste Ergänzung/Überschreibung: behalten | display, grid-template-rows, opacity, margin-bottom, transform-origin, scale, transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.calendar-section` | 601 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | scale, rotate; bedingt: @media (prefers-reduced-motion: reduce) |
| `.calendar-card` | 299 | Teilweise überschrieben: löschen background → 457, border → 457, border-radius → 457; Rest am Ort behalten | padding, box-shadow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.calendar-card` | 363 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | padding; bedingt: @media (max-width: 650px) |
| `.calendar-card` | 457 | Bewusste Ergänzung/Überschreibung: behalten | background, border, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-header` | 300 | Bewusste Ergänzung/Überschreibung: behalten | display, grid-template-columns, align-items, gap, margin-bottom; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-header` | 364 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | gap, margin-bottom; bedingt: @media (max-width: 650px) |
| `.cal-month-label` | 302 | Bewusste Ergänzung/Überschreibung: behalten | grid-column, text-align, font; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-month-label` | 365 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | font-size; bedingt: @media (max-width: 650px) |
| `.cal-nav-btn` | 306 | Teilweise überschrieben: löschen border → 467, border-radius → 467, color → 467, background → 467; Rest am Ort behalten | width, height, flex-shrink, display, place-items, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-nav-btn` | 426 | Bewusste Ergänzung/Überschreibung: behalten | border-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-nav-btn` | 467 | Bewusste Ergänzung/Überschreibung: behalten | border-radius, background, color, border; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-details-close` | 306 | Teilweise überschrieben: löschen border → 467, border-radius → 467, color → 467, background → 467; Rest am Ort behalten | width, height, flex-shrink, display, place-items, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-details-close` | 426 | Bewusste Ergänzung/Überschreibung: behalten | border-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-details-close` | 467 | Bewusste Ergänzung/Überschreibung: behalten | border-radius, background, color, border; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover-close` | 306 | Teilweise überschrieben: löschen border → 467, border-radius → 467, color → 467, background → 467; Rest am Ort behalten | width, height, flex-shrink, display, place-items, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover-close` | 426 | Bewusste Ergänzung/Überschreibung: behalten | border-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover-close` | 467 | Bewusste Ergänzung/Überschreibung: behalten | border-radius, background, color, border; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-nav-btn:disabled` | 307 | Teilweise überschrieben: löschen color → 469; Rest am Ort behalten | cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-nav-btn:disabled` | 469 | Bewusste Ergänzung/Überschreibung: behalten | color, background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-grid` | 310 | Bewusste Ergänzung/Überschreibung: behalten | display, gap, min-width; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-grid` | 366 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | min-width, gap; bedingt: @media (max-width: 650px) |
| `.cal-week` | 311 | Bewusste Ergänzung/Überschreibung: behalten | position, display, grid-template-columns, gap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-week` | 367 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | gap; bedingt: @media (max-width: 650px) |
| `.cal-day` | 313 | Teilweise überschrieben: löschen border-radius → 479; Rest am Ort behalten | min-height, min-width, display, flex-direction, gap, padding, border; Basis-Mindesthöhe/Padding vor mobiler Regel; Shape, Border und Motion separat |
| `.cal-day` | 368 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | min-height, padding; bedingt: @media (max-width: 650px) |
| `.cal-day` | 479 | Bewusste Ergänzung/Überschreibung: behalten | border-radius; Basis-Mindesthöhe/Padding vor mobiler Regel; Shape, Border und Motion separat |
| `.cal-day` | 584 | Bewusste Ergänzung/Überschreibung: behalten | transition; Basis-Mindesthöhe/Padding vor mobiler Regel; Shape, Border und Motion separat |
| `.cal-day` | 609 | Bewusste Ergänzung/Überschreibung: behalten | border-color; Basis-Mindesthöhe/Padding vor mobiler Regel; Shape, Border und Motion separat |
| `.cal-day-select` | 319 | Bewusste Ergänzung/Überschreibung: behalten | display, align-items, width, min-width, min-height, margin-left, padding, border, border-radius, color, background, font, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-select` | 369 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | flex-direction, justify-content, padding, min-height, width, margin; bedingt: @media (max-width: 650px) |
| `.cal-day-num` | 320 | Vollständig überschrieben: löschen (font-variant-numeric → 393) | — |
| `.cal-day-num` | 393 | Bewusste Ergänzung/Überschreibung: behalten | font-variant-numeric; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-num-inner` | 321 | Teilweise überschrieben: löschen border-radius → 480; Rest am Ort behalten | display, place-items, width, height; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-num-inner` | 480 | Bewusste Ergänzung/Überschreibung: behalten | border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-num-inner` | 583 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-dots` | 323 | Bewusste Ergänzung/Überschreibung: behalten | display; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-dots` | 370 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | display, justify-content, gap, height, margin-top; bedingt: @media (max-width: 650px) |
| `.cal-period-band` | 325 | Bewusste Ergänzung/Überschreibung: behalten | position, height, border-radius, background, color, padding, font-size, font-weight, line-height, pointer-events, white-space, overflow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-period-band` | 443 | Bewusste Ergänzung/Überschreibung: behalten | box-shadow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-event-tag` | 327 | Bewusste Ergänzung/Überschreibung: behalten | display, width, min-height, text-align, border, border-left, border-radius, padding, color, background, font, overflow-wrap, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-event-tag` | 372 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | display; bedingt: @media (max-width: 650px) |
| `.cal-more` | 332 | Bewusste Ergänzung/Überschreibung: behalten | border, border-radius, background, color, font, min-height, min-width, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-more` | 372 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | display; bedingt: @media (max-width: 650px) |
| `.cal-day-details` | 333 | Teilweise überschrieben: löschen margin-top → 580, padding → 580; Rest → 580 | border, border-radius, background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-details` | 580 | Bewusste Ergänzung/Überschreibung: behalten | display, grid-template-rows, padding, margin-top, border-width, opacity, transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-event` | 338 | Bewusste Ergänzung/Überschreibung: behalten | display, justify-content, gap, min-height, width, padding, border, border-radius, color, background, text-align, font, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-event` | 373 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | flex-direction, gap; bedingt: @media (max-width: 650px) |
| `.cal-day-event-meta` | 345 | Bewusste Ergänzung/Überschreibung: behalten | display, flex-direction, gap, text-align, color, font-size; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-day-event-meta` | 374 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | text-align; bedingt: @media (max-width: 650px) |
| `.cal-mobile-dot` | 351 | Bewusste Ergänzung/Überschreibung: behalten | width, height, flex-shrink, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-mobile-dot` | 371 / `@media (max-width: 650px)` | Bewusste Ergänzung/Überschreibung: behalten | width, height; bedingt: @media (max-width: 650px) |
| `.cal-popover` | 354 | Teilweise überschrieben: löschen display → 585, border-radius → 482, background → 482; Rest am Ort behalten | flex-direction, gap, position, z-index, width, padding, border, color, box-shadow; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover` | 482 | Bewusste Ergänzung/Überschreibung: behalten | background, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover` | 585 | Bewusste Ergänzung/Überschreibung: behalten | display, visibility, opacity, scale, contain, transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover` | 601 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | scale, rotate; bedingt: @media (prefers-reduced-motion: reduce) |
| `.cal-popover-btn` | 361 | Teilweise überschrieben: löschen border → 467, border-radius → 467, color → 467, background → 467; Rest am Ort behalten | min-height, padding, font, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover-btn` | 426 | Bewusste Ergänzung/Überschreibung: behalten | border-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover-btn` | 467 | Bewusste Ergänzung/Überschreibung: behalten | border-radius, background, color, border; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `button:focus-visible` | 383 | Bewusste Ergänzung/Überschreibung: behalten | outline, outline-offset; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `button:focus-visible` | 495 | Bewusste Ergänzung/Überschreibung: behalten | outline, outline-offset; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `button:focus-visible` | 515 | Bewusste Ergänzung/Überschreibung: behalten | --state-opacity; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `input[type="checkbox"]:focus-visible` | 383 | Bewusste Ergänzung/Überschreibung: behalten | outline, outline-offset; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `input[type="checkbox"]:focus-visible` | 495 | Bewusste Ergänzung/Überschreibung: behalten | outline, outline-offset; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stats-grid` | 393 | Bewusste Ergänzung/Überschreibung: behalten | font-variant-numeric; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stats-grid` | 410 | Bewusste Ergänzung/Überschreibung: behalten | display, grid-template-columns, gap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stats-grid` | 423 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | gap; bedingt: @media (max-width: 480px) |
| `.page-brand h1` | 402 | Bewusste Ergänzung/Überschreibung: behalten | font-size, line-height, font-weight, letter-spacing, overflow-wrap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.page-brand h1` | 448 | Bewusste Ergänzung/Überschreibung: behalten | font-variation-settings; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.header-actions` | 404 | Bewusste Ergänzung/Überschreibung: behalten | display, align-items, flex-wrap, gap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.header-actions` | 406 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | width, justify-content; bedingt: @media (max-width: 480px) |
| `.stat-tile` | 411 | Teilweise überschrieben: löschen background → 458, border → 458, border-radius → 458; Rest am Ort behalten | padding, box-shadow, display, flex-direction; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stat-tile` | 423 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | padding; bedingt: @media (max-width: 480px) |
| `.stat-tile` | 458 | Bewusste Ergänzung/Überschreibung: behalten | background, border, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stat-tile` | 508 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stat-label` | 412 | Bewusste Ergänzung/Überschreibung: behalten | font-size, color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stat-label` | 413 | Bewusste Ergänzung/Überschreibung: behalten | font-weight; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stat-note` | 412 | Bewusste Ergänzung/Überschreibung: behalten | font-size, color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stat-note` | 423 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | display; bedingt: @media (max-width: 480px) |
| `.stat-value` | 414 | Bewusste Ergänzung/Überschreibung: behalten | font, font-variant-numeric, margin; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stat-value` | 423 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | font-size; bedingt: @media (max-width: 480px) |
| `.stat-total` | 415 | Bewusste Ergänzung/Überschreibung: behalten | font-size, color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.stat-total` | 423 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | font-size; bedingt: @media (max-width: 480px) |
| `.list-controls` | 419 | Bewusste Ergänzung/Überschreibung: behalten | display, flex-wrap, align-items, gap; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.list-controls` | 423 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | width; bedingt: @media (max-width: 480px) |
| `.segmented-filter` | 420 | Teilweise überschrieben: löschen padding → 473, background → 473, border → 473, border-radius → 473; Rest am Ort behalten | display; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.segmented-filter` | 423 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | width; bedingt: @media (max-width: 480px) |
| `.segmented-filter` | 426 | Bewusste Ergänzung/Überschreibung: behalten | border-color; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.segmented-filter` | 473 | Bewusste Ergänzung/Überschreibung: behalten | position, isolation, gap, padding, border, border-radius, background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.segmented-filter button` | 421 | Teilweise überschrieben: löschen border-radius → 474, color → 474; Rest am Ort behalten | min-height, min-width, padding, border, font, background, cursor; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.segmented-filter button` | 423 / `@media (max-width: 480px)` | Bewusste Ergänzung/Überschreibung: behalten | flex, padding-inline; bedingt: @media (max-width: 480px) |
| `.segmented-filter button` | 474 | Bewusste Ergänzung/Überschreibung: behalten | position, z-index, border-radius, color, font-variation-settings; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.segmented-filter button[aria-pressed="true"]` | 422 | Vollständig überschrieben: löschen (background → 477, color → 477, box-shadow → 477) | — |
| `.segmented-filter button[aria-pressed="true"]` | 441 | Teilweise überschrieben: löschen outline → 477; Rest am Ort behalten | outline-offset; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.segmented-filter button[aria-pressed="true"]` | 477 | Bewusste Ergänzung/Überschreibung: behalten | background, color, box-shadow, outline, border-radius, font-variation-settings; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.filter-indicator` | 478 | Bewusste Ergänzung/Überschreibung: behalten | position, z-index, inset, width, transform, background, border-radius, pointer-events; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.filter-indicator` | 521 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.filter-indicator` | 603 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | transition; bedingt: @media (prefers-reduced-motion: reduce) |
| `.check-mark path` | 492 | Bewusste Ergänzung/Überschreibung: behalten | stroke-dasharray, stroke-dashoffset; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.check-mark path` | 525 | Bewusste Ergänzung/Überschreibung: behalten | transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `button` | 494 | Bewusste Ergänzung/Überschreibung: behalten | touch-action; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `button` | 513 | Bewusste Ergänzung/Überschreibung: behalten | position, --state-opacity, transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.theme-option[aria-checked="true"] svg` | 512 | Bewusste Ergänzung/Überschreibung: behalten | rotate, scale; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.theme-option[aria-checked="true"] svg` | 601 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | scale, rotate; bedingt: @media (prefers-reduced-motion: reduce) |
| `button:active` | 515 | Bewusste Ergänzung/Überschreibung: behalten | --state-opacity; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `button:active` | 600 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | transform; bedingt: @media (prefers-reduced-motion: reduce) |
| `.card:active` | 520 | Bewusste Ergänzung/Überschreibung: behalten | transform, border-radius; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.card:active` | 600 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | transform; bedingt: @media (prefers-reduced-motion: reduce) |
| `::view-transition-old(*)` | 540 | Bewusste Ergänzung/Überschreibung: behalten | mix-blend-mode; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `::view-transition-old(*)` | 541 | Bewusste Ergänzung/Überschreibung: behalten | animation; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `::view-transition-new(*)` | 540 | Bewusste Ergänzung/Überschreibung: behalten | mix-blend-mode; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `::view-transition-new(*)` | 542 | Bewusste Ergänzung/Überschreibung: behalten | animation; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress span::before` | 552 | Bewusste Ergänzung/Überschreibung: behalten | content, position, inset, width, transform, background, mask, opacity, scale, transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress span::before` | 554 | Bewusste Ergänzung/Überschreibung: behalten | background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress span::after` | 553 | Bewusste Ergänzung/Überschreibung: behalten | content, position, left, right, height, top, border-radius, background, opacity, transition; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.mini-progress span::after` | 554 | Bewusste Ergänzung/Überschreibung: behalten | background; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.ripple-origin` | 562 | Bewusste Ergänzung/Überschreibung: behalten | position, left, top, width, height, border-radius, background, opacity; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.ripple-origin` | 601 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | scale, rotate; bedingt: @media (prefers-reduced-motion: reduce) |
| `.timeline-dot:is(:hover,:focus-visible) .timeline-point` | 571 | Bewusste Ergänzung/Überschreibung: behalten | scale; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot:is(:hover,:focus-visible) .timeline-point` | 601 / `@media (prefers-reduced-motion: reduce)` | Bewusste Ergänzung/Überschreibung: behalten | scale, rotate; bedingt: @media (prefers-reduced-motion: reduce) |
| `.timeline-dot:not([data-tooltip-dismissed]):is(:hover,:focus,[data-tooltip-open="true"]) .timeline-tooltip` | 574 | Bewusste Ergänzung/Überschreibung: behalten | visibility, scale, opacity, transition-delay; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.timeline-dot:not([data-tooltip-dismissed]):is(:hover,:focus,[data-tooltip-open="true"]) .timeline-tooltip` | 575 / `@starting-style` | Bewusste Ergänzung/Überschreibung: behalten | opacity, scale; bedingt: @starting-style |
| `.cal-popover[data-open="true"]` | 586 | Bewusste Ergänzung/Überschreibung: behalten | visibility, opacity, scale, transition-delay; gemeinsame Komponenten-/Typografie-/State-Regeln; Spezifität und Kaskadenposition erhalten |
| `.cal-popover[data-open="true"]` | 587 / `@starting-style` | Bewusste Ergänzung/Überschreibung: behalten | opacity, scale; bedingt: @starting-style |

## Änderungen pro Selektor

| Selektor | Entfernt / zusammengeführt (B-Zeilen) |
| --- | --- |
| `body` | 62: entfernt transition → 508 |
| `.page-header` | 76: entfernt justify-content → 400, gap → 400, margin-bottom → 400; zusammengeführt → 400 (display, align-items, flex-wrap) |
| `.theme-switch` | 90: entfernt background → 470, box-shadow → 470, transition → 508 |
| `.theme-switch-thumb` | 104: entfernt background → 471, transition → 509 |
| `.theme-option` | 121: entfernt transition → 510 |
| `.theme-option:focus-visible` | 146: entfernt outline → 495, outline-offset → 495 |
| `.hero` | 167: entfernt background → 449, border → 449, border-radius → 449 |
| `.hero.imminent` | 169: entfernt background → 451 |
| `.hero-number` | 173: zusammengeführt → 453 (font, letter-spacing) |
| `.hero-next` | 183: entfernt border-radius → 456 |
| `.mini-progress` | 190: entfernt height → 550, background → 550, overflow → 550; zusammengeführt → 550 (border-radius, margin-top); 428: entfernt background → 550, outline → 550 |
| `.mini-progress span` | 191: entfernt height → 551, background → 551; zusammengeführt → 551 (display, border-radius); 530: zusammengeführt → 551 (transition) |
| `.hero-period .mini-progress span` | 192: entfernt background → 444; 444: entfernt background → 551 (!important) |
| `.type-icon` | 194: entfernt border-radius → 465 |
| `.timeline-card` | 201: entfernt background → 457, border → 457, border-radius → 457 |
| `.timeline-track::before` | 205: entfernt background → 564 |
| `.timeline-period-label` | 208: entfernt color → 427, white-space → 427; zusammengeführt → 427 (position, top, transform, font-size, background, border-left, padding-left, font-weight) |
| `.timeline-dot` | 210: entfernt background → 565, box-shadow → 565 |
| `.timeline-dot::before` | 211: entfernt width → 567, margin-left → 567; zusammengeführt → 567 (content, position, height, left, top, margin-top) |
| `.timeline-dot.cancelled` | 214: entfernt background → 566, border → 566 |
| `.timeline-tooltip` | 218: entfernt bottom → 573, display → 573 |
| `.stats-container` | 238: entfernt display → 409, margin-bottom → 409; zusammengeführt → 409 (justify-content, align-items, flex-wrap, gap) |
| `.pill` | 242: entfernt background → 467, border → 467, color → 467, font-size → 405, padding → 405, min-height → 405, border-radius → 467, transition → 513 |
| `.pill.active` | 245: entfernt background → 468, color → 468 |
| `.card` | 259: entfernt background → 461, border-radius → 461, transition → 508; zusammengeführt → 265 (position, min-width, border, border-left, padding, box-shadow) |
| `.card:hover` | 261: entfernt box-shadow → 462 |
| `.badge` | 269: entfernt border-radius → 466 |
| `.countdown` | 279: entfernt font-variant-numeric → 393; zusammengeführt → 483 (align-self, margin-top, text-align, display, flex-direction); 438: zusammengeführt → 483 (min-height, justify-content) |
| `.done-toggle input` | 290: entfernt border-radius → 488, transition → 524 |
| `.done-toggle input::before` | 291: entfernt content → 490 |
| `.done-toggle input:checked` | 292: entfernt background → 489 |
| `.calendar-section` | 298: entfernt margin-bottom → 577 |
| `.calendar-card` | 299: entfernt background → 457, border → 457, border-radius → 457 |
| `.cal-nav-btn` | 306: entfernt border → 467, border-radius → 467, color → 467, background → 467 |
| `.cal-day-details-close` | 306: entfernt border → 467, border-radius → 467, color → 467, background → 467 |
| `.cal-popover-close` | 306: entfernt border → 467, border-radius → 467, color → 467, background → 467 |
| `.cal-nav-btn:disabled` | 307: entfernt color → 469 |
| `.cal-day` | 313: entfernt border-radius → 479 |
| `.cal-day-num` | 320: entfernt font-variant-numeric → 393 |
| `.cal-day-num-inner` | 321: entfernt border-radius → 480 |
| `.cal-day-details` | 333: entfernt margin-top → 580, padding → 580; zusammengeführt → 580 (border, border-radius, background) |
| `.cal-popover` | 354: entfernt display → 585, border-radius → 482, background → 482 |
| `.cal-popover-btn` | 361: entfernt border → 467, border-radius → 467, color → 467, background → 467 |
| `.stat-tile` | 411: entfernt background → 458, border → 458, border-radius → 458 |
| `.segmented-filter` | 420: entfernt padding → 473, background → 473, border → 473, border-radius → 473 |
| `.segmented-filter button` | 421: entfernt border-radius → 474, color → 474 |
| `.segmented-filter button[aria-pressed="true"]` | 422: entfernt background → 477, color → 477, box-shadow → 477; 441: entfernt outline → 477 |

Zusätzlich gelöscht: `.timeline-date-label` (221) und `.timeline-date-tick` (222), seit Fix 4b ohne DOM-Knoten; `.stat-tile .mini-progress span` (429), Background von transparent `!important` (551) überschrieben. Diese Selektoren kommen nur einmal vor und erscheinen daher nicht in der Duplikattabelle.

