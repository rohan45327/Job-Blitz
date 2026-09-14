# JobBlitz — Mobile Frontend Architecture Specification

## 1. Core Stack & Principles

- **Framework**: React Native + Expo (TypeScript)
- **State Management**: Zustand for global auth, profile, local graph, and active job state.
- **Server Data Sync**: React Query (`@tanstack/react-query`) for cached async operations.
- **Design System**: OLED Pure Black (`#000000`) foundation, slate surfaces (`#0A0A0A`, `#111111`), cyan (`#1D9BF0`) for Match Score, emerald (`#00BA7C`) for Readiness Score.

## 2. Navigation Architecture

```
Primary Navigation Bar (Bottom Tabs):
├── HOME (Daily Command Center & Action Plan)
├── JOBS (Match Feed with Dual Badges 94% MATCH / 78% READY)
├── PREPARE (7-Day Prep Roadmap, STAR Coach, Resume Defense, Company Brief)
├── APPLICATIONS (Tracker Pipeline: Saved -> Applied -> OA -> Interview -> Offer)
├── WATCHLIST (Company Hiring Activity Signals)
└── PROFILE (Personal Background, Skills, Projects, Resumes)

Global Hardware Overlays:
├── Camera OCR Scanner (Job flyer/poster camera input)
└── Voice Assistant & Mock Interview Overlay
```

## 3. Performance & 60 FPS Target Guidelines

1. **Virtualized Lists**: Use `FlatList` with `getItemLayout` and `initialNumToRender={8}` for smooth 60 FPS scrolling on job feeds.
2. **Local Caching**: All job detail views, match scores, and readiness assessments are cached locally in AsyncStorage / SQLite so navigation is instantaneous.
3. **No Layout Jank**: Pre-allocate dimensions for card badges and image logos.
