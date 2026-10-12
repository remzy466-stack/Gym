# APEX KINETIX — AI Personal Trainer, Biomechanical Form Coach & Nutrition Hub

APEX KINETIX is a full-stack athletic coaching and nutrition platform that combines custom workout routine generation, integrated meal and macro logging, real-time AI form analysis, community challenges with smart notifications, and instant live voice coaching alongside direct emergency hotline access (`07057124133`).

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selection in Phase 1, **all four core modules** (AI Meal Photo Analyzer & Quick Macro Logger, Custom AI Workout Routine Builder & Progress Tracker, Daily Readiness Check-In & Recovery Guidance, and Community Challenges Leaderboard & Smart Notification Center) will be featured on the main dashboard alongside the **Real-Time AI Form Studio** and **Live Coaching & Emergency Call Center (`07057124133`)**.

- **Confirmed Dashboard Scope**: All four core pillars—workout progress & AI routine builder, meal & macro logging with photo analysis, daily readiness & recovery guidance, and social challenges with push notifications—are integrated and directly accessible from the primary command dashboard.
- **Real-Time Form Correction Studio**: Supports both live webcam frame capture and uploaded workout photos/clips analyzed via server-side Gemini multimodal vision (`gemini-3.8-flash`) to deliver joint-angle feedback, posture cues, and injury prevention corrections.
- **Live Call & Emergency Dispatch (`07057124133`)**: Includes an interactive **Live Coaching & Emergency Call Drawer** that can answer incoming AI coaching check-in calls, launch an interactive two-way voice coaching session with spoken AI audio (`gemini-3.8-flash-lite-tts`), and trigger a one-tap direct phone call (`tel:07057124133`) or emergency triage protocol.
- **Visual Direction**: High-contrast dark athletic performance aesthetic (`#090D16` obsidian slate canvas, `#111827` surface cards, and `#CCFF00` kinetic volt / `#10B981` emerald accents) engineered for instant legibility during workouts.

---

## 1. Overview & Core Concept

- **What It Does**: Acts as an always-on digital gym instructor and nutritionist. Athletes can log sets, reps, and personal records; generate tailored workout routines based on recovery readiness; log meals via text or food photo to track daily macros (Protein, Carbs, Fats, Calories); check exercise biomechanics in real time; compete in social accountability challenges; and answer or initiate live coaching calls or emergency guidance (`07057124133`).
- **Target Audience / Persona**: Gym-goers, strength & conditioning athletes, and fitness enthusiasts seeking structured progression, nutritional accountability, and immediate biomechanical or emergency support during training sessions.
- **Key Value**: Eliminates the disconnect between workout tracking, diet compliance, form safety, and live human/AI accountability by unifying all four into a single responsive workspace.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Command Dashboard & Daily Readiness Check-In**:
   - Users land on a multi-column desktop workspace (responsive for mobile thumb navigation) featuring a **Daily Readiness & Advice Banner** where adjusting sleep, soreness, and energy sliders dynamically updates their readiness score and requests personalized daily coaching advice from Gemini.
   - Displays today's macro progress rings, active workout summary, upcoming challenge milestones, and an incoming/on-demand **Live Coach Call** widget.
2. **Custom AI Workout Routine Builder & Active Logger**:
   - Users log sets, weight (`kg`/`lbs`), reps, and RPE with a built-in rest timer, or generate a custom routine by selecting target muscle groups, equipment, time available, and training goal (Hypertrophy, Strength, Fat Loss, Mobility).
3. **Real-Time AI Biomechanical Form Correction**:
   - Users select an exercise (e.g., Barbell Squat, Deadlift, Overhead Press, Push-Up), activate their live webcam (with periodic/on-demand frame capture) or upload a training photo, and receive structured biomechanical scoring, spine/knee alignment cues, and spoken audio feedback.
4. **Integrated Meal Logging & AI Food Photo Macro Tracker**:
   - Users track daily Calories, Protein, Carbs, and Fat targets, log meals from quick presets or custom inputs, or snap/upload a meal photo for Gemini to automatically break down ingredients and macro grams.
5. **Social Challenges & Push Notification Center**:
   - Users join community accountability challenges (e.g., *30-Day 100g+ Protein Streak*, *October 50,000 kg Volume Club*), log progress to climb the leaderboard, post accountability check-ins, and configure browser push notifications & in-app reminder alerts.
6. **Live Coaching Call & Emergency Guidance (`07057124133`)**:
   - Features a dedicated **Live Call & Emergency Center** plus a simulated "Incoming Trainer Check-In Call" alert that users can pick up for a live voice-guided session (powered by Web Speech API + Gemini + `gemini-3.8-flash-lite-tts` audio playback) or immediately dial `07057124133` for live trainer/emergency intervention with first-aid strain/sprain triage steps.

### Visual Identity & Theme
- **Aesthetic Direction**: Precision Athletic Performance Studio—clean, high-contrast dark surfaces with razor-sharp tabular telemetry and zero decorative clutter.
- **Color Palette & Mood**:
  - `--background`: Deep Obsidian Slate (`#0B0F17`) — 60% dominant canvas
  - `--surface`: Elevated Carbon (`#131B2E`) with `1px solid rgba(255,255,255,0.08)` hairline borders — 30% structural surface
  - `--primary`: Kinetic Volt (`#D4FF00`) for primary CTAs and active workout states — 10% accent budget
  - `--accent-emerald`: Bio-Emerald (`#10B981`) for nominal form alignment and macro target completion
  - `--accent-amber`: Warning Amber (`#F59E0B`) for form adjustments and macro deficits
  - `--accent-crimson`: Emergency Crimson (`#EF4444`) strictly reserved for emergency call (`07057124133`) and critical injury warnings
- **Typography & Hierarchy**:
  - *Display / Headings*: `Barlow Condensed` / `Outfit` (600–700 weight, tight tracking, balanced headline wrapping)
  - *Body Prose*: `Plus Jakarta Sans` (400/500 weight, high legibility at 14px–16px)
  - *Metrics, Timers & Macros*: `JetBrains Mono` with `tabular-nums` for all weights, reps, timers, macro grams, and phone numbers
- **Component Styling & Layout**:
  - Adheres to the **Top Bar Contract**: Zone 1 Brand Wordmark (`APEX KINETIX`), Zone 2 four single-line navigation links (`Dashboard`, `Workouts & Form`, `Nutrition`, `Challenges`), and Zone 3 primary action button (`Live Coach · 07057124133`).
  - Full 1440px desktop multi-column layout (`max-w-7xl mx-auto`) with single-elevation cards and unboxed metadata separated by `·`.
- **Interactive Feedback & Motion**:
  - Fast `150ms` transitions on set completion checkboxes, interactive SVG macro rings, live audio waveform visualization during coaching calls, and non-blocking toast notifications for workout PRs and hydration/meal reminders.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Gemini API Architecture with Multimodal & TTS Support**
  - *Chosen Approach*: Express backend (`server.ts`) hosting `/api/ai/daily-advice`, `/api/ai/workout-generator`, `/api/ai/form-check`, `/api/ai/meal-analyze`, and `/api/ai/live-call` using `gemini-3.8-flash` for multimodal reasoning and `gemini-3.8-flash-lite-tts` for realistic spoken trainer audio.
  - *Why*: Protects the API key on the server, guarantees fast response times without requiring a paid key flow, and enables both visual form/meal inspection and natural voice coaching.
  - *Alternatives Considered*: Text-only coaching was rejected because real-time form correction and meal logging benefit enormously from camera/image input and spoken audio cues while mid-workout.
- **Decision 2: Hybrid Live Call & Emergency Hotline (`07057124133`)**
  - *Chosen Approach*: Combines an interactive in-app AI Voice Call interface (supporting both "Pick Up Incoming Trainer Call" and "Start Live Coaching Call") with a persistent, one-tap direct telephone link (`tel:07057124133`) and interactive emergency triage protocol.
  - *Why*: Satisfies both autonomous AI live voice coaching and immediate real-world telephone connectivity to `07057124133` during acute gym emergencies or live human trainer consultations.
- **Decision 3: Persistent Local State with Rich Seeded Athletic Data**
  - *Chosen Approach*: Client state persisted in `localStorage` with realistic pre-populated workouts, macro logs, readiness history, and active community challenges, plus full reset/custom entry support.
  - *Why*: Ensures zero-latency set logging in the gym while maintaining user progress across sessions.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        TOP NAVIGATION BAR (3-Zone Contract)                  │
│  [APEX KINETIX]     [Dashboard · Workouts & Form · Nutrition · Challenges]   │
│                                              [CTA: Live Coach · 07057124133] │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│  COMMAND DASHBOARD  │     │  WORKOUT & AI FORM  │     │  NUTRITION & SOCIAL  │
│  • Readiness Check  │     │  • Routine Builder  │     │  • Macro Rings & Log │
│  • AI Daily Advice  │     │  • Active Set Timer │     │  • AI Meal Photo Scan│
│  • Quick Macro/Set  │     │  • Webcam/Photo AI  │     │  • Challenge Board   │
│  • Incoming Call Bar│     │    Form Biomechanics│     │  • Push Alert Manager│
└─────────┬───────────┘     └──────────┬──────────┘     └──────────┬───────────┘
          │                            │                           │
          └────────────────────────────┼───────────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 LIVE COACHING & EMERGENCY CALL CENTER MODAL                  │
│  • Incoming Call Pickup Simulation & Two-Way Voice Session (Mic + AI TTS)    │
│  • Emergency Injury Triage Protocol & Direct Hotline Dialer (07057124133)    │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTP POST (/api/ai/*)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND SERVER (server.ts)                       │
│  • /api/ai/daily-advice      (gemini-3.8-flash JSON readiness & advice)      │
│  • /api/ai/workout-generator (gemini-3.8-flash structured routine schema)    │
│  • /api/ai/form-check        (gemini-3.8-flash vision biomechanics analysis) │
│  • /api/ai/meal-analyze      (gemini-3.8-flash vision/text macro estimation) │
│  • /api/ai/live-call         (gemini-3.8-flash + gemini-3.8-flash-lite-tts)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **`WorkoutRoutine & ExerciseSet`**: Tracks routine ID, title, target muscles, duration, exercises, sets (`weight`, `reps`, `rpe`, `completed`), and personal records.
- **`NutritionLog & MacroTargets`**: Tracks daily targets (`calories`, `protein`, `carbs`, `fats`, `waterMl`) and logged meals with timestamps, meal category, food items, and macro breakdown.
- **`ReadinessState`**: Tracks sleep hours, muscle soreness (1–10), energy level (1–10), computed readiness score (0–100%), and AI daily coaching recommendation.
- **`FormAnalysisResult`**: Stores exercise name, overall biomechanical score, joint alignment observations, corrective cues, and risk level (`Nominal`, `Caution`, `High Risk`).
- **`SocialChallenge & NotificationItem`**: Tracks challenge title, participant count, target metric, user progress, leaderboard rankings, and scheduled/triggered push notifications.

### Interactive Component & State Mapping
- **Readiness & Daily Advice Card**: Adjusting sliders recalculates readiness immediately; clicking `"Generate Daily Coaching Brief"` calls `/api/ai/daily-advice` and updates the daily training & nutrition prescription with optional voice readout.
- **Workout Logger & AI Routine Builder**: Users toggle set completion (triggering an automatic rest countdown timer), add/remove sets, or submit custom parameters to `/api/ai/workout-generator` to append a newly generated AI routine directly into their active workout queue.
- **Real-Time AI Form Analyzer**: Users toggle live webcam preview (capturing frames manually or on a live coaching interval) or upload an image/video frame; `/api/ai/form-check` returns structured posture diagnostics and speaks the primary correction cue aloud.
- **Meal & Macro Tracker**: Adding a meal via quick-log, manual form, or AI food photo upload (`/api/ai/meal-analyze`) immediately updates daily calorie and macro progress rings.
- **Social Challenges & Push Notifications**: Users can join/leave challenges, log incremental challenge reps/volume to move up the live leaderboard, trigger a simulated push notification or browser `Notification` API alert, and toggle reminder schedules.
- **Live Coaching & Emergency Call Center (`07057124133`)**: Users can answer a simulated incoming trainer check-in call, converse with the AI coach via microphone speech recognition or quick-response prompts with spoken WAV audio responses (`gemini-3.8-flash-lite-tts`), or click `"Call 07057124133 Now"` to trigger `tel:07057124133` alongside interactive emergency first-aid guidance.
