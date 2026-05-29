# Task 5 Evidence: Parse Error State (Recoverable)

## Verification Method
Playwright unavailable (Chrome not installed). Evidence via source inspection.

## Error States Implemented

### Empty Input Validation
- File: `src/components/EventInput.tsx`, lines 24-28
- When user clicks "Parse Event" with empty textarea, `emptyWarning` state is set to `true`.
- Textarea receives `event-textarea--invalid` class which applies `border-color: var(--danger)`.
- Inline warning text "Enter an event description to parse." appears with `role="alert"`.
- Textarea is auto-focused for immediate correction.
- Warning clears as soon as user types non-whitespace content.

### Parse Failure (Network/Backend/Auth/Parse Error)
- File: `src/components/EventInput.tsx`, lines 46-49 (catch block)
- `ApiClientError` is caught and its `message` is displayed.
- Error messages are human-readable per `src/lib/api.ts`:
  - `network_unavailable`: "You appear to be offline. Check your connection and try again."
  - `backend_unavailable`: "Calendur could not reach the backend. Try again in a moment."
  - `auth_required`: "Connect Google Calendar before continuing."
  - `parse_failed`: "Calendur could not parse that event. Try rephrasing it."
  - `rate_limited`: "Too many requests. Try again in one minute."
- Error card uses `role="alert"` for accessibility.
- "Try again" button re-invokes the parse function with the same input text.
- No raw stack traces or technical error codes are shown to the user.

### Loading State
- Parse button shows spinner animation + "Parsing..." text while request is in flight.
- Textarea and button are disabled during loading to prevent double-submission.
- Loading state clears in `finally` block regardless of success/failure.

## Recovery Paths
1. Empty input → type text → click Parse again
2. Parse error → click "Try again" button → same request retried
3. Parse error → edit text in textarea → click Parse again
4. Any error → Back from preview is not needed (error stays on input view)
