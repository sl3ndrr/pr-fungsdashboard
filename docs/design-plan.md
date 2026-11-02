# Semester-Roadmap: Design- und Umsetzungsstand

Stand: 24.10.2026. Drei aufeinanderfolgende Commits: A Zeitstrahl, B Seitenlayout,
C Material-3-Expressive-Konsistenz. „Implementiert“ bedeutet hier Code und Node-Checks;
ein Browser-Abnahmehaken wird erst nach tatsächlichem Browserlauf gesetzt.

## A – Zeitstrahl

## B – Seitenlayout

## C – Material 3 Expressive

## Verifikation

Ausgang: 44/44 Node-Tests. Nach A und B: je 38/38 (alte Scroll-/Entzerrungstests
ersetzt). Nach C: 40/40 einschließlich zwei zusätzlicher Kontrastprüfungen;
CSS-Scanner: 3/3. Playwright erkennt 372 Fälle in fünf Spec-Dateien.
Je Phase wurde ein Chromium-Fall gestartet; alle drei scheitern vor dem Seitenaufruf
an fehlenden Browser-Binaries. Download HTTP 403; Cloud-Vorschau ebenfalls blockiert.
Kein Screenshot-Baseline-Update, keine visuellen Messwerte, kein Performance-Trace.

Vollständiger Bericht: [verification-report.md](verification-report.md).
Browserbefehle: [visual-tests.md](visual-tests.md).
