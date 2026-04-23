export type Phase = 'select' | 'memorize' | 'recall' | 'result'

export interface State {
  phase: Phase
  digitCount: number
  sequence: number[]
  currentIndex: number
  input: string
  isCorrect: boolean
  streak: number
  bestStreak: number
}

type Listener = (s: State) => void
const listeners = new Set<Listener>()

const STORAGE_KEY = 'numgame_v2'

function load(): Pick<State, 'streak' | 'bestStreak'> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  catch { return { streak: 0, bestStreak: 0 } }
}

function save(s: State) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ streak: s.streak, bestStreak: s.bestStreak }))
}

const saved = load()

let state: State = {
  phase: 'select',
  digitCount: 10,
  sequence: [],
  currentIndex: 0,
  input: '',
  isCorrect: false,
  streak: saved.streak ?? 0,
  bestStreak: saved.bestStreak ?? 0,
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  save(state)
  listeners.forEach(fn => fn(state))
}

export const subscribe = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn) }
export const getState = () => state

export function selectDigitCount(n: number) {
  const seq = Array.from({ length: n }, () => Math.floor(Math.random() * 10))
  set({ phase: 'memorize', digitCount: n, sequence: seq, currentIndex: 0, input: '' })
}

export function nextDigit() {
  if (state.phase !== 'memorize') return
  const next = state.currentIndex + 1
  if (next >= state.sequence.length) {
    set({ phase: 'recall', currentIndex: next })
  } else {
    set({ currentIndex: next })
  }
}

export function setInput(val: string) {
  if (state.phase !== 'recall') return
  const clean = val.replace(/\D/g, '').slice(0, state.sequence.length)
  set({ input: clean })
}

export function submitRecall() {
  if (state.phase !== 'recall') return
  const correct = state.input === state.sequence.join('')
  const streak = correct ? state.streak + 1 : 0
  const bestStreak = Math.max(streak, state.bestStreak)
  set({ phase: 'result', isCorrect: correct, streak, bestStreak })
}

export function playAgain() {
  const seq = Array.from({ length: state.digitCount }, () => Math.floor(Math.random() * 10))
  set({ phase: 'memorize', sequence: seq, currentIndex: 0, input: '' })
}

export function goToSelect() {
  set({ phase: 'select' })
}
