# Task 5 Evidence: Parse Preview UI (Mobile Viewport)

## Verification Method
Playwright unavailable (Chrome not installed at /Applications/Google Chrome.app). Evidence via source inspection + build output + HTTP preview.

## Build Verification
- `npm run build` exits 0 with no errors or warnings.
- Output: `dist/index.html`, `dist/assets/index-VAmbIWKZ.css` (9.22 KB), `dist/assets/index-nYrPl1wB.js` (160.92 KB).
- LSP diagnostics: clean on all modified TSX files.

## Parse Preview UI Present
- `EventInput` component renders textarea, parse button, empty-input warning, loading spinner, and recoverable error with retry button.
- `EventPreview` component renders editable fields: title (text input), date (date input), start/end time (time inputs in 2-column row), location (text input), recurrence (read-only humanized RRULE, shown conditionally), timezone (read-only display), calendar (select from calendars list), reminders (select + remove + add, capped at 5).
- Settings defaults applied: `loadSettings()` called on parse success; `defaultDuration` used to compute end time when parsed event lacks one; `defaultCalendarId` pre-selects calendar; `defaultReminders` populate reminder list.
- Back button returns to input view and clears parsed state.

## Mobile Viewport Safety
- All new CSS uses existing design tokens: `var(--surface)`, `var(--border)`, `var(--radius-sm/md/lg)`, `var(--touch-min)`, `var(--safe-*)`.
- `overflow-x: hidden` on html/body/#root prevents horizontal scroll.
- `.shell` uses `width: min(100%, 560px)` with safe-area padding.
- Touch targets: all inputs/selects/buttons inherit `min-height: var(--touch-min)` (44px); parse button and action buttons use 48px.
- `.preview-field-row` uses `grid-template-columns: 1fr 1fr` for side-by-side time pickers.
- `@media (max-width: 420px)` reduces card padding for small screens.
- Date/time inputs use `color-scheme: dark` and `-webkit-appearance: none` for iOS Safari compatibility.

## Parse Failure Recovery
- `EventInput` catches `ApiClientError` and displays `error.message` in a styled error card with a "Try again" button.
- Error card uses `role="alert"` for screen reader announcement.
- Retry button re-invokes `handleParse()` with the same input text.
- Empty input shows inline warning and focuses the textarea.

## Files Modified
- `src/components/EventInput.tsx` (new)
- `src/components/EventPreview.tsx` (new)
- `src/App.tsx` (modified: added view state machine, EventInput/EventPreview wiring, calendar loading on session change)
- `src/styles.css` (modified: added event-input-card, event-preview-card, and mobile-safe field styles)
