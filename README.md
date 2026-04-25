# numgame

Number Memorization Game

## Project structure

numgame/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── main.ts
│   ├── store.ts
│   └── style.css
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts

## Game flow

### 1. Settings screen
- Pick digit count: **4 / 6 / 8 / 10 / 15** or type any custom number
- Pick display style: **one at a time** or **all at once**
- Pick mode: **free-time** or **timed**
- Timed mode shows the science-backed duration before you start

### 2. Memorize — one at a time
- Each digit shown individually, large and centered
- **Free-time**: press `→`, `Space`, or click Next to advance
- **Timed**: auto-advances every 1.5s per digit (Baddeley phonological loop)

### 3. Memorize — all at once
- All digits shown simultaneously, grouped in rows of 5
- **Free-time**: press "I'm ready" when done
- **Timed**: a progress bar counts down (3s base + 0.5s per digit), then auto-proceeds

### 4. Recall screen
- Type the full sequence from memory
- Keyboard auto-focused, digits only
- Counter shows progress (e.g. 4 / 10)
- Press Enter or click Submit when done

### 5. Result screen
- **Correct or wrong** verdict
- Side-by-side comparison: correct sequence vs your answer
- Wrong digits are underlined
- Streak and best streak shown
- **Play again** restarts with same settings
- **Settings** goes back to the settings screen
