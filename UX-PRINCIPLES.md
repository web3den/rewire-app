# Rewire UX Principles

These apply to EVERY screen and component. Non-negotiable.

## Input Design
- **Never use raw text inputs for structured data** (dates, times, selections)
- Dates → native date picker (DateTimePicker with spinner/wheel display)
- Selections → visual cards, radio buttons, or bottom sheets — NOT dropdowns
- Enable iOS autofill (`textContentType`, `autoComplete`) for name, email, etc.
- Always show clear placeholder text and validation feedback inline

## Visual Design
- Journey meets Studio Ghibli: dark, warm, atmospheric — never sterile or clinical
- Buttons must have clear visual hierarchy (primary = gold glow, secondary = outline)
- Buttons must never overlap keyboard or get pushed off screen
- Minimum touch target: 44x44pt
- Spacing should breathe — never cram elements

## Onboarding
- No quizzes, no forms, no personality tests
- Onboarding is immersive narrative — Kael narrates, user makes choices in-world
- All choices equally appealing (no "cool" answer)
- Typing should be minimal — tap/swipe interactions preferred
- DOB is the only "form" field and it uses a native picker

## Error Handling
- Never show raw error messages to users
- "Edge Function returned a non-2xx status code" → "Something went wrong. Let's try again."
- Always offer a retry action
- Loading states on every button that triggers async work

## Navigation
- Back buttons always visible in onboarding
- Transitions should feel atmospheric (fade, not harsh slide)
- Never dead-end the user — always a way forward or back

## Accessibility
- All interactive elements have labels
- Color is never the only indicator
- Text meets WCAG AA contrast ratios
- Support Dynamic Type where possible
