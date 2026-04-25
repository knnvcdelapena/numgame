import { supabase } from './supabase'

export async function submitScore({
  userId,
  sequence,
  answer,
  digitCount,
  displayStyle,
  gameMode,
}: {
  userId: string
  sequence: number[]
  answer: string
  digitCount: number
  displayStyle: string
  gameMode: string
}): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-score`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ sequence, answer, digitCount, displayStyle, gameMode }),
    }
  )

  const data = await res.json()
  return data.eloChange ?? 0
}