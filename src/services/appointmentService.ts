import { supabase } from "./supabaseClient";

export async function createAppointment(data: {
  patient_id: string;
  slot_id: string;
  status: "pending" | "confirmed" | "cancelled";
}) {
  return supabase.from("appointments").insert(data);
}

export async function markSlotAsUnavailable(slotId: string) {
  return supabase
    .from("availability_slots")
    .update({ is_available: false })
    .eq("id", slotId);
}

export async function markSlotAsAvailable(slotId: string) {
  return supabase
    .from("availability_slots")
    .update({ is_available: true })
    .eq("id", slotId);
}

export async function cancelAppointment(appointmentId: string) {
  return supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);
}

export async function confirmAppointment(appointmentId: string) {
  return supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointmentId);
}