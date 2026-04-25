export type Phase =
  | "select"
  | "memorize-one"
  | "memorize-all"
  | "recall"
  | "result";
export type GameMode = "timed" | "freetime";
export type DisplayStyle = "one-at-a-time" | "all-at-once";

export interface State {
  phase: Phase;
  gameMode: GameMode;
  displayStyle: DisplayStyle;
  digitCount: number;
  sequence: number[];
  currentIndex: number;
  input: string;
  isCorrect: boolean;
  streak: number;
  bestStreak: number;
}

type Listener = (s: State) => void;
const listeners = new Set<Listener>();

const STORAGE_KEY = "numgame_v3";

function load(): Partial<State> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(s: State) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      streak: s.streak,
      bestStreak: s.bestStreak,
      gameMode: s.gameMode,
      displayStyle: s.displayStyle,
      digitCount: s.digitCount,
    }),
  );
}

const saved = load();

let state: State = {
  phase: "select",
  gameMode: (saved.gameMode as GameMode) ?? "freetime",
  displayStyle: (saved.displayStyle as DisplayStyle) ?? "one-at-a-time",
  digitCount: (saved.digitCount as number) ?? 6,
  sequence: [],
  currentIndex: 0,
  input: "",
  isCorrect: false,
  streak: (saved.streak as number) ?? 0,
  bestStreak: (saved.bestStreak as number) ?? 0,
};

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  save(state);
  listeners.forEach((fn) => fn(state));
}

export const subscribe = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getState = () => state;

// Science-backed timings
// One-at-a-time: 1.5s per digit (Baddeley phonological loop)
// All-at-once: 3s base + 0.5s per digit (chunking theory)
export function getTimedDuration(style: DisplayStyle, count: number): number {
  if (style === "one-at-a-time") return 1500;
  return 3000 + count * 500;
}

export function setGameMode(mode: GameMode) {
  set({ gameMode: mode });
}
export function setDisplayStyle(style: DisplayStyle) {
  set({ displayStyle: style });
}
export function setDigitCount(n: number) {
  set({ digitCount: n });
}

export function startGame(overrideCount?: number) {
  const count = overrideCount ?? state.digitCount;
  if (overrideCount) set({ digitCount: overrideCount });
  const seq = Array.from({ length: count }, () =>
    Math.floor(Math.random() * 10),
  );

  if (state.displayStyle === "all-at-once") {
    set({ phase: "memorize-all", sequence: seq, currentIndex: 0, input: "" });
    if (state.gameMode === "timed") {
      const duration = getTimedDuration("all-at-once", state.digitCount);
      setTimeout(() => {
        if (getState().phase === "memorize-all") set({ phase: "recall" });
      }, duration);
    }
  } else {
    set({ phase: "memorize-one", sequence: seq, currentIndex: 0, input: "" });
    if (state.gameMode === "timed") autoAdvance();
  }
}

function autoAdvance() {
  const duration = getTimedDuration("one-at-a-time", state.digitCount);
  setTimeout(() => {
    const s = getState();
    if (s.phase !== "memorize-one") return;
    const next = s.currentIndex + 1;
    if (next >= s.sequence.length) {
      set({ phase: "recall", currentIndex: next });
    } else {
      set({ currentIndex: next });
      autoAdvance();
    }
  }, duration);
}

export function nextDigit() {
  if (state.phase !== "memorize-one" || state.gameMode !== "freetime") return;
  const next = state.currentIndex + 1;
  if (next >= state.sequence.length) {
    set({ phase: "recall", currentIndex: next });
  } else {
    set({ currentIndex: next });
  }
}

export function startRecall() {
  if (state.phase !== "memorize-all" || state.gameMode !== "freetime") return;
  set({ phase: "recall" });
}

export function setInput(val: string) {
  if (state.phase !== "recall") return;
  const clean = val.replace(/\D/g, "").slice(0, state.sequence.length);
  set({ input: clean });
}

export function submitRecall() {
  if (state.phase !== "recall") return;
  const correct = state.input === state.sequence.join("");
  const streak = correct ? state.streak + 1 : 0;
  const bestStreak = Math.max(streak, state.bestStreak);
  set({ phase: "result", isCorrect: correct, streak, bestStreak });
}

export function playAgain() {
  startGame();
}
export function goToSelect() {
  set({ phase: "select" });
}
