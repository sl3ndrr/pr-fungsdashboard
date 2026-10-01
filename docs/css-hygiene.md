# PR C – CSS-Hygiene

67 überschattete/identische Deklarationen und zwei obsolete Datumsregeln
wurden entfernt. Keine neuen Pakete, kein Refactoring von JS/HTML, keine
verschobenen Regeln, keine geänderten Tokens oder Motion-Werte.

Automatische Bereinigung ist bewusst auf bedingungslose Top-Level-Regeln mit
exakt demselben Selektor und derselben Property beschränkt. Spätere Deklarationen
gewinnen (unter Beachtung von `!important`). `@media`, `@supports`, Keyframes und
registrierte Properties bleiben unverändert. Teilüberschreibungen durch
Shorthands, mögliche Fallbacks und nicht sicher bewiesene Duplikate bleiben stehen.

Zusätzlich entfallen die durch die transparente Fill-Fläche überschatteten
Backgrounds für Hero/Statistik, der identische Tooltip-Fokus-/Hover-Display-Wert
und die seit Fix 4b nicht mehr gerenderten Datumsticks/-labels.

## Entfernte Deklarationen

Zeilennummern beziehen sich auf PR B vor der Bereinigung.

| Selektor | Entfernte Properties | Alte Zeilen → spätere Gewinner |
| --- | --- | --- |
| `.badge` | border-radius | 269 → 466 |
| `.cal-day` | border-radius | 313 → 479 |
| `.cal-day-details` | margin-top, padding | 333 → 580, 333 → 580 |
| `.cal-day-num-inner` | border-radius | 321 → 480 |
| `.cal-nav-btn:disabled` | color | 307 → 469 |
| `.cal-popover` | background, border-radius, display | 354 → 482, 354 → 482, 354 → 585 |
| `.calendar-section` | margin-bottom | 298 → 577 |
| `.card` | background, border-radius | 259 → 461, 259 → 461 |
| `.card:hover` | box-shadow | 261 → 462 |
| `.done-toggle input` | border-radius, transition | 290 → 524, 290 → 488 |
| `.done-toggle input::before` | content | 291 → 490 |
| `.done-toggle input:checked` | background | 292 → 489 |
| `.hero` | background, border, border-radius | 167 → 449, 167 → 449, 167 → 449 |
| `.hero-next` | border-radius | 183 → 456 |
| `.hero-period .mini-progress span` | background | 192 → 444, identischer/!important-Wert |
| `.hero.imminent` | background | 169 → 451 |
| `.mini-progress` | background, height, outline, overflow | 428 → 550, 428 → 550, 190 → 550, 190 → 550, 190 → 550 |
| `.mini-progress span` | background, height | 191 → 551, 191 → 551 |
| `.page-header` | gap, justify-content, margin-bottom | 81 → 400, 80 → 400, 78 → 400 |
| `.pill` | font-size, min-height, padding | 242 → 405, 242 → 405, 242 → 405 |
| `.pill.active` | background, color | 245 → 468, 245 → 468 |
| `.segmented-filter` | background, border, border-radius, padding | 420 → 473, 420 → 473, 420 → 473, 420 → 473 |
| `.segmented-filter button` | border-radius, color | 421 → 474, 421 → 474 |
| `.stat-tile` | background, border, border-radius | 411 → 458, 411 → 458, 411 → 458 |
| `.stat-tile .mini-progress span` | background | identischer/!important-Wert |
| `.stats-container` | display, margin-bottom | 238 → 409, 238 → 409 |
| `.theme-option` | transition | 134 → 510 |
| `.theme-switch` | background, box-shadow | 99 → 470, 98 → 470 |
| `.theme-switch-thumb` | background, transition | 113 → 509, 110 → 471 |
| `.timeline-date-label` | (obsolete rule) | 221 |
| `.timeline-date-tick` | (obsolete rule) | 222 |
| `.timeline-dot.cancelled` | background, border | 214 → 566, 214 → 566 |
| `.timeline-dot::before` | margin-left, width | 211 → 567, 211 → 567 |
| `.timeline-dot:hover .timeline-tooltip, .timeline-dot:focus-visible .timeline-tooltip` | display | identischer/!important-Wert |
| `.timeline-period-label` | color, white-space | 208 → 427, 208 → 427 |
| `.timeline-tooltip` | bottom, display | 218 → 573, 218 → 573 |
| `.timeline-track::before` | background | 205 → 564 |
| `.type-icon` | border-radius | 194 → 465 |

## Prüfung

Die letzten bedingungslosen Selektor-/Property-Werte wurden vor/nach der
Bereinigung statisch verglichen, mit ausdrücklich dokumentierten Ausnahmen für
die redundanten/obsoleten Regeln. Bestehende Node-Regressionen, Modulsyntax und
Whitespace-Prüfung bestehen. Produktdaten und JS sind im Diff zu B unverändert.

Die visuelle Gleichheit ist noch offen. PR C bleibt ein Entwurf. Die aktualisierte
Test-Infrastruktur aus B wurde nachgezogen; der nicht freigegebene CI-Workflow
ist entfernt. Nach Erzeugung und Prüfung der B-Baselines ist der Vergleich im
gepinnten Docker-Image auszuführen (siehe `docs/visual-tests.md`). Ein grüner
Browserlauf oder echte Screenshots werden hier nicht behauptet.
