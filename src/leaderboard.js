import { supabase } from "./supabase";
export async function getLeaderboard() {
    const { data } = await supabase
        .from("users")
        .select("id, username, avatar_url, elo, games_played, games_won")
        .order("elo", { ascending: false })
        .limit(50);
    return data ?? [];
}
export async function getUserRank(userId) {
    const { data } = await supabase
        .from("users")
        .select("id, elo")
        .order("elo", { ascending: false });
    if (!data)
        return null;
    const rank = data.findIndex((u) => u.id === userId) + 1;
    return rank > 0 ? rank : null;
}
