# Akshay Suresh Portfolio

A cinematic, game-inspired portfolio for Akshay Suresh — full-stack developer and computer science student. Built with React, Vite, Tailwind CSS, and Framer Motion.

## Features

- Interactive menu with project inventory, skills, experience timeline, lore, and contact
- Scroll-driven memory timeline with animated cards and progress indicator
- Fruit Ninja mini-game easter egg
- Responsive layout for desktop and mobile

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (24 recommended)
- [pnpm](https://pnpm.io/) 11+

## Getting started

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run the portfolio dev server |
| `pnpm build` | Typecheck and build all workspace packages |
| `pnpm --filter @workspace/akshay-portfolio run build` | Build the portfolio for production |
| `pnpm --filter @workspace/akshay-portfolio run serve` | Preview the production build |

## Project structure

```
artifacts/akshay-portfolio/   # Main portfolio app (Vite + React)
lib/                          # Shared API and database packages
artifacts/api-server/         # Express API server (optional)
artifacts/mockup-sandbox/     # UI mockup sandbox (optional)
```

## Tech stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Framer Motion
- **Monorepo:** pnpm workspaces
- **Language:** TypeScript

## License

MIT
