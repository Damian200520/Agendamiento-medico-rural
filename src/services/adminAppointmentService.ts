import { supabase } from "./supabaseClient";

export async function getAllAppointments() {
  return supabase
    .from("appointments")
    .select("id, patient_id, slot_id, status, created_at")
    .order("created_at", { ascending: false });
}

export async function getProfilesByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", userIds);
}

export async function getSlotsByIds(slotIds: string[]) {
  if (slotIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from("availability_slots")
    .select("id, specialty, date, time")
    .in("id", slotIds);
}