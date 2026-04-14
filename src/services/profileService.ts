import { supabase } from "./supabaseClient";

export async function getProfileById(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).single();
}