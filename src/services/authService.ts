import { supabase } from "./supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: {
    full_name?: string;
    phone?: string;
    role?: "patient" | "staff";
  }
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => Promise<void>
) {
  return supabase.auth.onAuthStateChange(callback);
}