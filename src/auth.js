import { supabase } from "./supabase";
export async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: window.location.origin },
    });
}
export async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
    });
}
export async function signOut() {
    await supabase.auth.signOut();
}
export async function getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
}
export async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
}
export async function ensureUserProfile(user) {
    const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();
    if (!data) {
        await supabase.from("users").insert({
            id: user.id,
            username: user.user_metadata?.full_name ??
                user.user_metadata?.user_name ??
                "Anonymous",
            avatar_url: user.user_metadata?.avatar_url ?? null,
        });
    }
}
