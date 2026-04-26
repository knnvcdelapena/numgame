import { ensureUserProfile } from './auth'
import { submitScore } from './scores'
import { supabase } from './supabase'

export type Phase = 'landing' | 'select' | 'memorize-one' | 'memorize-all' | 'recall' | 'result'
export type GameMode = 'timed' | 'freetime'
export type DisplayStyle = 'one-at-a-time' | 'all-at-once'

export interface User {
  id: string
  username: string
  avatar_url: string | null
  elo: number
}

export interface State {
  phase: Phase
  gameMode: GameMode
  displayStyle: DisplayStyle
  digitCount: number
  sequence: number[]
  currentIndex: number
  input: string
  isCorrect: boolean
  streak: number
  bestStreak: number
  eloChange: number | null
  user: User | null
  authLoading: boolean
}

type Listener = (s: State) => void
const listeners = new Set<Listener>()

const STORAGE_KEY = 'numgame_v3'
const USER_CACHE_KEY = 'numgame_user'

function load(): Partial<State> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  catch { return {} }
}

function save(s: State) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    streak: s.streak,
    bestStreak: s.bestStreak,
    gameMode: s.gameMode,
    displayStyle: s.displayStyle,
    digitCount: s.digitCount,
  }))
}

// Load cached user for instant UI on refresh
function loadCachedUser(): User | null {
  try { return JSON.parse(localStorage.getItem(USER_CACHE_KEY) ?? 'null') }
  catch { return null }
}

const saved = load()
const cachedUser = loadCachedUser()

let state: State = {
  phase: cachedUser ? 'select' : 'landing',
  gameMode: (saved.gameMode as GameMode) ?? 'freetime',
  displayStyle: (saved.displayStyle as DisplayStyle) ?? 'one-at-a-time',
  digitCount: (saved.digitCount as number) ?? 6,
  sequence: [],
  currentIndex: 0,
  input: '',
  isCorrect: false,
  streak: (saved.streak as number) ?? 0,
  bestStreak: (saved.bestStreak as number) ?? 0,
  eloChange: null,
  user: cachedUser,
  authLoading: true,
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  save(state)
  listeners.forEach(fn => fn(state))
}

export const subscribe = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn) }
export const getState = () => state

export function getTimedDuration(style: DisplayStyle, count: number): number {
  if (style === 'one-at-a-time') return 1500
  return 3000 + count * 500
}

export function setUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    set({ user, authLoading: false, phase: 'select' })
  } else {
    localStorage.removeItem(USER_CACHE_KEY)
    set({ user: null, authLoading: false, phase: 'landing' })
  }
}

export async function refreshUserFromDb(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, username, avatar_url, elo')
    .eq('id', userId)
    .single()
  if (data) setUser(data)
}

export async function handleSignIn(authUser: any) {
  await ensureUserProfile(authUser)
  await refreshUserFromDb(authUser.id)
}

// ── Game actions ─────────────────────────────────────────────────────────────

export function setGameMode(mode: GameMode) { set({ gameMode: mode }) }
export function setDisplayStyle(style: DisplayStyle) { set({ displayStyle: style }) }
export function setDigitCount(n: number) { set({ digitCount: n }) }

export function startGame(overrideCount?: number) {
  const count = overrideCount ?? state.digitCount
  if (overrideCount) set({ digitCount: overrideCount })
  const seq = Array.from({ length: count }, () => Math.floor(Math.random() * 10))

  if (state.displayStyle === 'all-at-once') {
    set({ phase: 'memorize-all', sequence: seq, currentIndex: 0, input: '' })
    if (state.gameMode === 'timed') {
      const duration = getTimedDuration('all-at-once', count)
      setTimeout(() => {
        if (getState().phase === 'memorize-all') set({ phase: 'recall' })
      }, duration)
    }
  } else {
    set({ phase: 'memorize-one', sequence: seq, currentIndex: 0, input: '' })
    if (state.gameMode === 'timed') autoAdvance()
  }
}

function autoAdvance() {
  const duration = getTimedDuration('one-at-a-time', state.digitCount)
  setTimeout(() => {
    const s = getState()
    if (s.phase !== 'memorize-one') return
    const next = s.currentIndex + 1
    if (next >= s.sequence.length) {
      set({ phase: 'recall', currentIndex: next })
    } else {
      set({ currentIndex: next })
      autoAdvance()
    }
  }, duration)
}

export function nextDigit() {
  if (state.phase !== 'memorize-one' || state.gameMode !== 'freetime') return
  const next = state.currentIndex + 1
  if (next >= state.sequence.length) {
    set({ phase: 'recall', currentIndex: next })
  } else {
    set({ currentIndex: next })
  }
}

export function startRecall() {
  if (state.phase !== 'memorize-all' || state.gameMode !== 'freetime') return
  set({ phase: 'recall' })
}

export function setInput(val: string) {
  if (state.phase !== 'recall') return
  const clean = val.replace(/\D/g, '').slice(0, state.sequence.length)
  set({ input: clean })
}

export async function submitRecall() {
  if (state.phase !== 'recall') return
  const correct = state.input === state.sequence.join('')
  const streak = correct ? state.streak + 1 : 0
  const bestStreak = Math.max(streak, state.bestStreak)

  let eloChange: number | null = null

  if (state.user) {
    eloChange = await submitScore({
      sequence: state.sequence,
      answer: state.input,
      digitCount: state.digitCount,
      displayStyle: state.displayStyle,
      gameMode: state.gameMode,
    })
    await refreshUserFromDb(state.user.id)
  }

  set({ phase: 'result', isCorrect: correct, streak, bestStreak, eloChange })
}

export function playAgain() { startGame() }
export function goToSelect() { set({ phase: 'select' }) }
export function goToLanding() { set({ phase: 'landing' }) }