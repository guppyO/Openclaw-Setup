# Browser Ops

## Modes

- `openclaw`: managed isolated browser, default for research and low-trust automation.
- `chrome`: attached system browser relay, default for sensitive or already-authenticated sessions.

## Rules

- Start with managed mode unless auth state or anti-bot behavior says otherwise.
- Capture a screenshot, PDF, or HTML artifact for important external actions.
- If login fails, record the exact blocker and continue other work rather than looping.
