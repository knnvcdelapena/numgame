# numgame

Minimal number memorization game.

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
