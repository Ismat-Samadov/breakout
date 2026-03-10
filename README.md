# 🕹️ Breakout — Neon Edition

A fully-featured, neon-themed **Breakout arcade game** built with **Next.js 15**, **TypeScript** (strict mode), and **Tailwind CSS v4**. Rendered on an HTML5 Canvas with a synthesised Web Audio soundtrack — no external assets required.

---

## ✨ Features

| Category | Details |
|---|---|
| **Gameplay** | 3 hand-crafted levels with unique brick layouts; ball physics; paddle angle control |
| **Difficulty** | Easy (5 lives), Medium (3 lives), Hard (2 lives) — affects speed, power-up rate |
| **Power-ups** | Wide Paddle · Extra Life · Multi-Ball · Slow Ball · Fire Ball |
| **Visuals** | Neon/cyberpunk theme; Canvas glow with `shadowBlur`; ball motion trail; brick shake & particle explosions |
| **Audio** | Procedural sound effects (Web Audio API) — no files; global mute toggle |
| **Mobile** | Fully responsive; on-screen ◀ ● ▶ controls; touch-move for paddle |
| **Desktop** | Arrow keys / A·D / Mouse movement / Space to launch / P to pause |
| **Persistence** | High score saved to `localStorage` |
| **UX** | Animated menus (Framer Motion); pause screen; level-clear; game-over; victory screens |

---

## 🖥️ Tech Stack

- **Next.js 15** (App Router, React Server Components)
- **TypeScript** strict mode
- **Tailwind CSS v4** — utility classes only, no inline styles
- **Framer Motion** — menu and overlay animations
- **HTML5 Canvas 2D** — game rendering
- **Web Audio API** — synthesised sound effects

---

## 🎮 Controls

### Keyboard (Desktop)
| Key | Action |
|---|---|
| `←` / `A` | Move paddle left |
| `→` / `D` | Move paddle right |
| `Space` / `Enter` | Launch ball / Resume from pause |
| `P` / `Escape` | Pause / Resume |

### Mouse (Desktop)
- Move mouse over the canvas to control the paddle.
- Click to launch ball.

### Touch (Mobile)
- **◀** button — move paddle left
- **●** button — launch ball
- **▶** button — move paddle right
- Swipe / drag on the canvas to move the paddle

---

## 📁 Project Structure

```
app/
├── components/
│   ├── BreakoutGame.tsx   # Root component — canvas + HUD + overlays
│   ├── GameMenu.tsx       # Start screen with difficulty selection
│   ├── GameHUD.tsx        # In-game score / lives / level / power-up display
│   ├── GameOverlay.tsx    # Pause / Level Complete / Game Over / Victory
│   └── MobileControls.tsx # Touch buttons (hidden on sm+)
├── hooks/
│   └── useBreakoutGame.ts # All game logic — loop, physics, collision, rendering
├── lib/
│   ├── types.ts           # Shared TypeScript types
│   ├── constants.ts       # Game-wide constants and config
│   ├── levels.ts          # Level brick-grid designs
│   └── sounds.ts          # Procedural sound synthesis (Web Audio)
├── globals.css            # Tailwind import + base styles
├── layout.tsx             # Root layout with metadata
└── page.tsx               # Entry page
public/
└── favicon.svg            # Neon SVG favicon
```

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd breakout

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

> **Node.js ≥ 18** is required.

---

## ☁️ Deploy to Vercel

The project is **zero-config** on Vercel:

```bash
# Option A — Vercel CLI
npm i -g vercel
vercel

# Option B — GitHub integration
# Push to GitHub, then import the repo at https://vercel.com/new
# Framework: Next.js (auto-detected). Click Deploy.
```

No environment variables are required.

---

## 🏗️ Architecture Notes

- **Game loop** runs via `requestAnimationFrame` inside a `useEffect`. A delta-time cap of 40 ms prevents spiral-of-death on tab-hide/show.
- **Refs for mutable game state** (balls, bricks, paddle, particles) avoid triggering re-renders inside the loop. Only score/lives/level/gameState are React state (they drive UI).
- **Canvas scaling** — internal resolution is 800 × 600 game units drawn to a `canvas` element that is CSS-scaled to fill its container. `devicePixelRatio` scaling is applied for crisp HiDPI rendering.
- **Collision detection** uses an AABB Minkowski-expanded approach: the brick is expanded by the ball radius, then the ball centre is checked against the expanded box. Penetration depth determines the reflected axis.
- **Sound** is synthesised entirely with the Web Audio API oscillator + gain nodes. No external audio files are loaded.

---

## 📜 Licence

MIT — free to use, modify, and distribute.
