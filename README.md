# numgame

Minimal number memorization game. ## Dev

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages (free)

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** → set to **GitHub Actions**
3. Push to `main` — the workflow auto-builds and deploys

> **Note**: If your repo name is not the root (`username.github.io`), set `base` in `vite.config.ts`:
> ```ts
> base: '/your-repo-name/'
> ```

## Project structure

```
src/
  main.ts      # render loop + event binding
  store.ts     # plain object state + localStorage persistence
  style.css    # Roboto Mono, monochrome
index.html
vite.config.ts
.github/workflows/deploy.yml
```

## Game flow

1. Pick digit count (10 / 15 / 20 / 25 / 30)
2. Digits appear one at a time — press `→` or `Space` (or click) to advance
3. Type the full sequence from memory
4. See correct vs your answer side-by-side, streak updates
