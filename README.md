# Rewire

A personal growth app that uses quests, narrative, and AI-guided conversations to help users build lasting habits across six life dimensions: Body, Mind, Heart, Courage, Order, and Spirit.

## Stack

- **Database**: Supabase (Postgres 15+ with RLS)
- **Backend**: Deno Edge Functions
- **AI**: Anthropic Claude / OpenAI
- **Client**: iOS (Swift)

## Getting Started

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno](https://deno.land/) 1.40+

### Local Development

```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db reset

# Seed sample data
supabase db reset  # runs seed.sql automatically

# Serve edge functions
supabase functions serve
```

## Project Structure

```
supabase/
├── migrations/    # SQL schema migrations
├── seed.sql       # Sample quest data
├── functions/     # Deno edge functions
└── config.toml    # Supabase project config
```

## Core Concepts

- **Quests**: Daily tasks across 6 domains, delivered in 3 slots (anchor, choice, ember)
- **Essence Compass**: Six stats (0-100) that grow/decay based on quest activity
- **The Guide**: AI companion that adapts tone and references user history
- **Fog Map**: A 100-tile map that reveals as users complete quests
- **Seasons**: 6-week narrative arcs with discovery moments and archetypes
