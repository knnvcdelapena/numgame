import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Rate limiting - max 1 submission per 5 seconds per user
const { data: recentGames } = await supabase
  .from('games')
  .select('played_at')
  .eq('user_id', user.id)
  .order('played_at', { ascending: false })
  .limit(1)

if (recentGames && recentGames.length > 0) {
  const lastGame = new Date(recentGames[0].played_at).getTime()
  const now = Date.now()
  const diff = now - lastGame

  if (diff < 5000) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

    // Parse body
    const { sequence, answer, digitCount, displayStyle, gameMode } = await req.json()

    // Verify answer server-side
    const isCorrect = sequence.join('') === answer

    // Calculate elo server-side
    const eloChange = calculateEloChange(digitCount, gameMode, isCorrect)

    // Get current user stats
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('elo, games_played, games_won')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const newElo = Math.max(100, userData.elo + eloChange)

    // Insert game record
    await supabase.from('games').insert({
      user_id: user.id,
      digit_count: digitCount,
      display_style: displayStyle,
      game_mode: gameMode,
      is_correct: isCorrect,
      elo_change: eloChange,
    })

    // Update user stats
    await supabase.from('users').update({
      elo: newElo,
      games_played: userData.games_played + 1,
      games_won: userData.games_won + (isCorrect ? 1 : 0),
    }).eq('id', user.id)

    return new Response(JSON.stringify({ isCorrect, eloChange, newElo }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function calculateEloChange(digitCount: number, gameMode: string, isCorrect: boolean): number {
  const base = 20
  let difficulty = 1.0
  if (digitCount <= 4)       difficulty = 0.5
  else if (digitCount <= 6)  difficulty = 0.75
  else if (digitCount <= 8)  difficulty = 1.0
  else if (digitCount <= 10) difficulty = 1.25
  else if (digitCount <= 15) difficulty = 1.5
  else                       difficulty = 1.75

  const modeMultiplier = gameMode === 'timed' ? 1.25 : 1.0
  const change = Math.round(base * difficulty * modeMultiplier)
  return isCorrect ? change : -change
}