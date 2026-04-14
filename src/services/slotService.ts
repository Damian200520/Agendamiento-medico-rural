import { supabase } from "./supabaseClient";

export async function getAvailableSlots() {
  return supabase
    .from("availability_slots")
    .select("*")
    .eq("is_available", true)
    .order("date", { ascending: true });
}

export async function createAvailabilitySlot(data: {
  staff_id: string;
  specialty: string;
  date: string;
  time: string;
}) {
  return supabase.from("availability_slots").insert({
    ...data,
    is_available: true,
  });
}