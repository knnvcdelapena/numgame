# NumGame

Number Memorization Game

## Project Structure

```
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
```

## Game Flow

### 1. Settings Screen

* Select digit count: **4 / 6 / 8 / 10 / 15** or custom input
* Choose display style:

  * **One at a time**
  * **All at once**
* Choose mode:

  * **Free-time**
  * **Timed**
* Timed mode shows a pre-calculated duration before starting

### 2. Memorize — One at a Time

* Digits appear individually, large and centered

**Free-time mode**

* Press `→`, `Space`, or click **Next**

**Timed mode**

* Auto-advances every **1.5s per digit**

### 3. Memorize — All at Once

* All digits displayed simultaneously
* Grouped in rows of 5

**Free-time mode**

* Click **"I'm ready"** when done

**Timed mode**

* Progress bar countdown:

  * **3s base + 0.5s per digit**
* Automatically proceeds after timer

### 4. Recall Screen

* Enter the full sequence from memory
* Input is auto-focused (digits only)
* Progress indicator (e.g. `4 / 10`)
* Submit using **Enter** or button

### 5. Result Screen

* Shows **correct or incorrect** result
* Side-by-side comparison:

  * Correct sequence
  * Your input
* Incorrect digits are underlined
* Displays:

  * Current streak
  * Best streak

**Actions**

* **Play Again** — restart with same settings
* **Settings** — return to configuration
