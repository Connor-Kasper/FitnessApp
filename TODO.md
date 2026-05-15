# MVP Workout Timer TODO

- [x] Redesign landing page (`src/app/page.tsx`) for no-auth MVP with strong CTA to workout dashboard
- [x] Build dashboard workout MVP (`src/app/dashboard/page.tsx`)
  - [x] Add exercise selector with predefined exercises
  - [x] Add set counter controls
  - [x] Add rep counter controls
  - [x] Add timer controls (start/pause/reset, work/rest presets)
  - [x] Add completion + reset states
  - [x] Add polished responsive UI and empty states
- [x] Add optional auth flow back in (non-blocking)
  - [x] Add magic-link auth option on landing page
  - [x] Show auth status/sign-out option in dashboard without blocking MVP usage
- [x] Run project verification (`npm run lint` and/or `npm run build`)

## Frictionless Gym-Floor MVP Upgrade
- [x] Refactor dashboard to Push/Pull/Legs templates and auto-load next day from latest workout
- [x] Add top-of-screen daily bodyweight quick-log (near 176 default) with one-tap save
- [x] Convert logging controls to numeric-first inputs (`inputMode="decimal"`) for set/rep/weight
- [x] Wire `Log Set` action to Supabase `sets` table
- [x] Wire `Finish Workout` action to Supabase `workouts` table
- [ ] Preserve clean dark-mode UI with low-friction flow
- [x] Run verification (`npm run lint`)

## Visibility + Progress Pages
- [ ] Improve dashboard text/input contrast for clear readability in dark mode
- [ ] Add dedicated progress page (`src/app/progress/page.tsx`)
- [ ] Add long-term trend graphs (bodyweight + training volume)
- [ ] Add navigation links to progress page from dashboard/home
- [ ] Run verification (`npm run lint`)
