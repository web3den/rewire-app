# Rewire Implementation Plan

## Phase 1: Core Infrastructure (lib/, stores/, types)
- lib/theme.ts — design system
- lib/supabase.ts — client + helpers
- lib/types.ts — all TypeScript types matching the schema + mental model
- lib/quest-engine.ts — quest assignment algorithm from SYSTEM-MENTAL-MODEL.md
- lib/archetype-engine.ts — archetype scoring + evolution logic
- lib/economy.ts — stat gain/decay, currency calculations
- lib/kael.ts — register selection, context assembly, prompt building
- stores/auth.ts — auth state, session, profile fetch
- stores/user.ts — profile, stats, currencies, archetype
- stores/quests.ts — daily quests, completion, refresh
- stores/guide.ts — chat sessions, messages, streaming
- stores/fog-map.ts — tile state, reveals

## Phase 2: Auth + Onboarding Screens
- app/_layout.tsx — root layout with auth routing
- app/index.tsx — redirect logic
- app/(auth)/ — welcome, sign-in, sign-up
- app/(onboarding)/ — prologue (3 pages), scenarios (Saturday, Conversation, Setback, Check-In, adaptive Choice), profile-setup, First Light quest

## Phase 3: Main App Screens
- app/(app)/(tabs)/ — quests, guide, map, compass
- Quest screen: Anchor/Choice/Ember slots, refresh with Sparks, quest cards, completion flow
- Guide screen: chat with Kael, streaming, energy counter
- Map screen: SVG fog map, tile reveals, landmarks
- Compass screen: radar chart, stat bars, currencies

## Phase 4: Components
- AtmosphericBackground, BackButton, GlowButton
- QuestCard (with tier styling, domain colors, flip-to-read for Choice)
- ChatBubble (Kael golden tint vs user)
- FogMap (SVG concentric rings, glow, dimming)
- RadarChart (6-axis, domain colors)
- AffectSelector (First Light: sea/fire/frost)
- EnergySlider (First Light: ember to flame)
- ScenarioCard (onboarding scenario choice cards)

## Phase 5: Edge Functions Update
- Update guide-chat to use new Kael intelligence system
- Update get-daily-quests to use quest assignment algorithm
- Update complete-quest to use stat/economy formulas
