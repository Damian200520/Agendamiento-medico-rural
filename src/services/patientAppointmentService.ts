import { supabase } from "./supabaseClient";

export async function getAppointmentsByPatientId(patientId: string) {
  return supabase
    .from("appointments")
    .select("id, patient_id, slot_id, status, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
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