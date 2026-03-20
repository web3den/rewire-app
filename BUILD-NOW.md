# BUILD NOW — Condensed Implementation Spec

## Stack
- Expo SDK 54, Expo Router v4, TypeScript strict
- Supabase client v2 (URL + anon key from EXPO_PUBLIC_* env vars in .env.local)
- Zustand for state, react-native-svg for visuals
- @react-native-community/datetimepicker for DOB
- NO react-native-url-polyfill needed

## Supabase Info
- Cloud project: afcmznpvlfmonxoiqdxm.supabase.co (us-east-2)
- Schema already deployed with 15+ tables, 20+ enums, RLS on all tables
- INSERT policies exist for user_profiles, user_currencies, user_stats
- Edge functions deployed: guide-chat, get-daily-quests, complete-quest, create-profile
- Email confirmation DISABLED

## File Structure to Build
```
lib/
  theme.ts          — dark theme (bg: #0A0A0F, accent gold: #E8A838, purple: #7B6FE0)
  supabase.ts       — createClient + helpers
  types.ts          — TS types for domains, tiers, archetypes, quest slots

stores/
  auth.ts           — session, profile, initialize, signIn, signUp, signOut, fetchProfile
  user.ts           — stats, currencies, archetype tendency
  quests.ts         — daily quests, complete quest, refresh
  guide.ts          — chat messages, send message, session management
  fog-map.ts        — tiles, reveal tile

components/
  AtmosphericBackground.tsx  — LinearGradient dark bg with subtle animated particles
  BackButton.tsx             — Pressable with chevron, absolute positioned top-left
  GlowButton.tsx             — Primary CTA with gold glow, loading state, disabled state
  QuestCard.tsx              — Quest display card with domain color, tier badge, expand
  ChatBubble.tsx             — Kael (golden tint bg) vs User (dark card bg)
  FogMap.tsx                 — SVG concentric rings, 100 tiles, revealed=gold, hidden=gray
  RadarChart.tsx             — 6-axis SVG radar, domain colors, filled polygon
  ScenarioCard.tsx           — Choice card for onboarding scenarios (emoji + text)

app/
  _layout.tsx       — Root: auth state check, route protection
  index.tsx         — Redirect: no session→welcome, no profile→onboarding, else→quests

  (auth)/
    _layout.tsx     — Stack, no headers, dark bg
    welcome.tsx     — "The fog is calling" atmospheric intro, 2 buttons: Sign In / Create Account
    sign-in.tsx     — Email + password, GlowButton, error handling
    sign-up.tsx     — Email + password, GlowButton, auto-redirect to onboarding

  (onboarding)/
    _layout.tsx     — Stack WITH back buttons (use headerLeft: BackButton)
    prologue.tsx    — 3 swipeable pages with dot indicators:
                      P1: "You've been here before..." (fog drifts)
                      P2: "This world exists between..." (fog lifts, warm glow)
                      P3: "I'm Kael..." (figure appears) + "Enter the Fog" button
    scenarios.tsx   — 4 scenarios, one at a time, transition between them:

      SCENARIO 1 - The Saturday:
      "You wake up with nothing planned. What pulls at you first?"
      6 choices: move(Body), figure out(Mind), reach out(Heart),
                 face something(Courage), get in order(Order), quiet(Spirit)

      SCENARIO 2 - The Conversation:
      "A friend tells you something vulnerable. What's your instinct?"
      6 choices: fix it(Mind), body tension(Body), lean in(Heart),
                 say honest thing(Courage), organize/change(Order), something deeper(Spirit)

      THE CHECK-IN (between scenario 2 and 3):
      "Right now, today, how are things?"
      4 choices: doing alright(functional), needs to change(stuck),
                 having a hard time(struggling), just getting through(acute)

      SCENARIO 3 - The Setback:
      "Something falls through. First ten seconds, what happens?"
      6 choices: body reacts(Body), mind analyzes(Mind), feel loss(Heart),
                 get defiant(Courage), make new plan(Order), go still(Spirit)

      Track archetype tendency scores. Store locally.

    profile-setup.tsx — Name input (autoComplete="name") + DateTimePicker (spinner, dark)
                        On submit: upsert user_profiles, user_currencies, user_stats directly
                        Set onboarding_completed=true, navigate to main app

    first-light.tsx   — The first quest. 3 steps, tap-based:
      Step 1: "How does today feel?" — 3 atmospheric cards:
        Heavy Sea (low/sad), Restless Fire (anxious/wired), Still Frost (numb/flat)
      Step 2: Energy slider — drag from dim ember to bright flame
      Step 3: "Where do you want to explore?" — 4 direction cards:
        Mountain (Courage), Garden (Body), Bridge (Heart), Observatory (Mind)
      On complete: reveal first fog tile, +1 to chosen domain stat

  (app)/
    _layout.tsx     — Bottom tab navigator
    (tabs)/
      _layout.tsx   — Tab config: Quests (sword icon), Guide (chat icon),
                      Map (map icon), Compass (compass icon)
                      Tab bar: dark bg (#12121A), gold active, muted inactive

      quests.tsx    — Daily quest view:
        ANCHOR slot: 1 assigned quest card (not refreshable)
        CHOICE slot: locked until Anchor complete, then shows 3 cards to pick from
        EMBER slot: always available, quick quest
        Refresh button on Choice slot (costs 1 Spark after free daily refresh)
        Show Sparks count
        Tap quest → expand details + "Begin Quest" button
        Complete quest → self-report + optional reflection (max 500 chars)
        On completion: insert quest_completions, update currencies/stats

      guide.tsx     — Chat with Kael:
        Message list with ChatBubbles
        Input bar at bottom
        Energy counter ("4 of 5" near input)
        On send: POST to guide-chat edge function
        Show response (not streaming for now — just wait for full response)
        If error: show Kael fallback response, never raw error
        First message if new session: Kael welcome based on time of day

      map.tsx       — Fog Map:
        SVG with concentric rings (5 rings, ~20 tiles each)
        Center tiles revealed first
        Revealed: filled gold with subtle glow
        Hidden: filled dark gray, slight fog overlay
        Tap revealed tile: tooltip with "Unlocked by [quest name]"
        Fog Light counter at top
        Pull tile state from fog_map_state table (or show defaults if no data)

      compass.tsx   — Essence Compass:
        RadarChart component (6 axes)
        Below: 6 horizontal stat bars with domain colors and values
        Below: 3 currency displays (Fragments, Energy, Fog Light)
        Pull from user_stats and user_currencies

## UX RULES (NON-NEGOTIABLE)
- Native DateTimePicker for dates (spinner, dark theme)
- Back buttons on all onboarding screens
- Loading state on EVERY async button
- Human-readable errors only (never raw JSON/code)
- 44pt minimum touch targets
- Dark theme throughout (#0A0A0F base)
- Fade transitions between screens
- iOS autofill enabled (textContentType, autoComplete)

## ERROR PATTERN
```typescript
try {
  setLoading(true);
  // async work
} catch (e) {
  console.error('context:', e);
  Alert.alert('Something went wrong', 'Please try again.');
} finally {
  setLoading(false);
}
```

## VERIFICATION CHECKLIST
After building:
1. npx tsc --noEmit — ZERO errors
2. Full flow: sign-up → prologue → scenarios → profile → first-light → quests
3. Every .from() call matches actual table/column names in the migration SQL
4. Every router.push/replace target exists as a file
5. No missing imports
