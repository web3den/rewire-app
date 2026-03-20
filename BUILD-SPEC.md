# Rewire App — Complete Build Spec (Clean Slate)

## READ THESE FILES FIRST
1. `UX-PRINCIPLES.md` — non-negotiable design rules
2. `supabase/migrations/20260315220000_initial_schema.sql` — full database schema (already deployed)
3. `supabase/functions/` — edge functions (already deployed)

## Stack
- Expo SDK 54 + Expo Router v4 (file-based routing)
- TypeScript strict
- Supabase JS client v2 (auth, database, edge function calls)
- Zustand for state management
- react-native-svg for fog map + radar chart
- @react-native-community/datetimepicker for date input
- react-native-reanimated for animations
- NO react-native-url-polyfill needed for SDK 54+

## Environment
- Supabase URL: loaded from `EXPO_PUBLIC_SUPABASE_URL` env var
- Supabase Anon Key: loaded from `EXPO_PUBLIC_SUPABASE_ANON_KEY` env var
- `.env.local` already exists with correct values

## Project Structure
```
app/
  _layout.tsx          — Root layout with auth state management
  index.tsx            — Redirect based on auth/onboarding state
  (auth)/
    _layout.tsx        — Stack navigator, no headers
    welcome.tsx        — Atmospheric welcome screen with "Begin" button
    sign-in.tsx        — Email + password sign in
    sign-up.tsx        — Email + password sign up (no email confirmation required)
  (onboarding)/
    _layout.tsx        — Stack navigator with back buttons
    prologue.tsx       — 3 swipeable narrative screens (Kael introduces the world)
    scenarios.tsx      — 4 archetype-detection scenarios (forced choice, immersive)
    profile-setup.tsx  — Name + DOB (native date picker) only
  (app)/
    _layout.tsx        — Bottom tab navigator
    (tabs)/
      _layout.tsx      — Tab bar configuration
      quests.tsx       — Daily quests (3 slots)
      guide.tsx        — Chat with Kael
      map.tsx          — Fog map
      compass.tsx      — Essence Compass radar chart + stats
lib/
  supabase.ts          — Supabase client + helpers
  theme.ts             — Design system (colors, typography, spacing)
  types.ts             — App-wide TypeScript types
components/
  AtmosphericBackground.tsx
  QuestCard.tsx
  ChatBubble.tsx
  FogMap.tsx
  RadarChart.tsx
  GlowButton.tsx
  BackButton.tsx
stores/
  auth.ts              — Auth state (session, profile, init)
  quests.ts            — Quest state
  guide.ts             — Guide chat state
  user.ts              — User profile, stats, currencies
```

## Design System (lib/theme.ts)
```typescript
// Journey meets Studio Ghibli — dark, warm, atmospheric
// Backgrounds: deep navy/charcoal (#0A0A0F, #12121A, #1A1A25)
// Primary accent: warm gold (#E8A838, #F4C97B)
// Secondary accent: soft purple (#7B6FE0, #9B91F0)
// Text: warm white (#E8E6E3), muted (#A8A4B0, #6B6777)
// Stat colors: vitality=#E05555, clarity=#5B8DEF, connection=#E8A838, valor=#D45CFF, foundation=#5BEF8D, depth=#7B6FE0
// Quest tiers: ember=#FF6B4A, flame=#E8A838, blaze=#D45CFF, inferno=#FF4444
```

## Auth Flow
- Email/password via Supabase Auth (email confirmation is DISABLED)
- NO Apple Sign-In for now (requires paid dev account)
- After sign-up → redirect to onboarding
- After sign-in with existing profile → redirect to main app
- Auth state persisted via AsyncStorage

## Onboarding Flow (THIS IS CRITICAL — READ CAREFULLY)

### Screen 1: Prologue (3 pages, swipeable)
This is NOT a slideshow of text. Each page is atmospheric and immersive.

**Page 1:** Dark screen. Fog particles drift slowly. Text fades in:
> "You've been here before. Not this place exactly. But this feeling — standing at the edge of something, knowing you should move, unable to start."

**Page 2:** Fog lifts slightly, warm glow appears:
> "This world exists between what you are and what you could be. The fog isn't punishment — it's just what happens when you stop moving."

**Page 3:** A silhouette of a figure (Kael) becomes visible:
> "I'm Kael. I've been waiting for you. Not because you're special — but because you showed up. That's the only part that matters."

Swipe between pages with dot indicators. "Enter the Fog" button on page 3.

### Screen 2: Archetype Scenarios (4 scenarios)
Each scenario is a narrative scene. NO quiz format. NO personality test language.

Present each as a full-screen scene with Kael narrating. Three options per scenario, displayed as cards. All options are equally valid — no "correct" answer.

**Scenario 1: The Crossroads**
Kael says: "The path splits three ways. You can hear water rushing to your left, voices to your right, and ahead — silence."
- 🌊 "The water" (Body/Vitality tendency)
- 👥 "The voices" (Heart/Connection tendency)  
- 🌑 "The silence" (Spirit/Depth tendency)

**Scenario 2: The Stranger**
Kael says: "Someone sits by the road, head in hands. They haven't noticed you."
- 🤝 "I sit down beside them" (Heart/Connection)
- 🔍 "I watch from here first" (Mind/Clarity)
- ⚡ "I say something — anything" (Courage/Valor)

**Scenario 3: The Room**
Kael says: "You find a room. Everything you've been avoiding is in it. The door is open."
- 🚪 "I walk in" (Courage/Valor)
- 🧹 "I start with the edges — organize first" (Order/Foundation)
- 📖 "I need to understand what's in there first" (Mind/Clarity)

**Scenario 4: The Mirror**
Kael says: "A mirror on the path. But it doesn't show your face — it shows how you spend your time when nobody's watching."
- 🏃 "I look away and keep walking" (Body/Vitality)
- 👁️ "I look. Really look." (Spirit/Depth)
- 🔨 "I already know. Show me what to fix." (Order/Foundation)

Show transition between scenarios. Track choices to set initial archetype tendency (stored locally, used later).

### Screen 3: Profile Setup
- Display name input (with iOS autofill: `textContentType="name"`, `autoComplete="name"`)
- Date of birth using native DateTimePicker (spinner/wheel mode, dark theme)
- Max date = 16 years ago (age gate)
- "Complete Setup" button

On submit: Insert into `user_profiles` table directly via Supabase client. Also initialize `user_currencies` (energy: 5, fragments: 0, fog_light: 3) and `user_stats` (all dimensions: 10).

Set `onboarding_completed = true`, then navigate to main app.

## Main App Screens

### Quests Tab
- Shows today's 3 quest slots: **Anchor** (assigned), **Choice** (pick 1 of 3), **Ember** (quick optional)
- Query quests from `quests` table, assignments from `daily_quest_slots`
- Each quest card shows: title, description, domain (color-coded), tier badge, time estimate
- Tap quest → expand to show full description + "Complete" button
- Complete → self-report screen (optional reflection text, 500 char max)
- On completion: insert into `quest_completions`, award fragments via `user_currencies`
- If no quests assigned today, show a seed quest selection

### Guide Tab (Chat with Kael)
- Chat interface with Kael's messages styled in a warm golden tint
- User messages styled in a subtle card
- On send: call `guide-chat` edge function with message + session_id
- Show typing indicator while waiting for response
- Display energy counter (e.g., "4 of 5 conversations remaining")
- First message from Kael (if new session): scripted welcome based on time of day
- Handle errors gracefully — show Kael fallback responses, never raw errors

### Map Tab (Fog Map)
- SVG visualization: concentric rings of hexagonal/circular tiles (100 total)
- Center tiles revealed first, radiating outward
- Revealed tiles: warm gold glow with slight pulse animation
- Unrevealed tiles: muted gray with fog overlay
- Tap a revealed tile: show what unlocked it (quest name, date)
- Fog Light counter displayed at top
- Pull fog tile state from `fog_map_state` table

### Compass Tab (Essence Compass)
- 6-axis radar chart (Vitality, Clarity, Connection, Valor, Foundation, Depth)
- Each axis uses its domain color
- Current values displayed as filled polygon with slight gradient
- Below radar: 6 stat bars with labels and numeric values
- Below stats: currency display (Fragments, Energy, Fog Light)
- Pull from `user_stats` and `user_currencies` tables

## Critical UX Rules (from UX-PRINCIPLES.md)
- EVERY screen has a back button in onboarding
- NEVER show raw error messages — always human-readable
- EVERY async button has a loading state
- Native pickers for dates — NEVER raw text input for structured data
- Minimum 44pt touch targets
- Dark theme throughout — consistent with theme.ts
- Animations should be subtle and atmospheric (fade, not bounce)
- Text must be readable (WCAG AA contrast)
- iOS autofill enabled where applicable

## Error Handling Pattern
```typescript
try {
  setLoading(true);
  // ... async operation
} catch (error) {
  Alert.alert('Something went wrong', 'Please try again.');
  console.error('Context:', error);
} finally {
  setLoading(false);
}
```

## What NOT to build
- Apple Sign-In (no paid dev account yet)
- Push notifications
- IAP / subscriptions
- Weekly LLM quest generation
- Memory compression
- Sound/haptics
- Squad system
- Mentorship

## Testing
After building, verify:
1. `npx expo start --lan` starts without errors
2. App loads in Expo Go (SDK 54)
3. Can sign up with email (no confirmation)
4. Onboarding flow completes end-to-end
5. Quests display with correct domain colors
6. Guide chat sends messages and gets responses
7. Fog map renders with SVG tiles
8. Compass radar chart renders 6 axes
9. All back buttons work
10. No raw error messages visible to user

When completely finished, run:
openclaw system event --text "Done: Rewire app rebuilt from clean slate — auth, onboarding, quests, guide chat, fog map, compass all working with proper UX" --mode now
