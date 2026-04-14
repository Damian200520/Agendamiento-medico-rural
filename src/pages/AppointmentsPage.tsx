import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import AppHeader from "../components/layout/AppHeader";
import { addPendingAction } from "../db/offlineQueue";
import useNetworkStatus from "../hooks/useNetworkStatus";
import { getAvailableSlots } from "../services/slotService";
import {
  createAppointment,
  markSlotAsUnavailable,
} from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";

type Slot = {
  id: string;
  staff_id: string;
  specialty: string;
  date: string;
  time: string;
  is_available: boolean;
  created_at: string;
};

export default function AppointmentsPage() {
  const isOnline = useNetworkStatus();
  const { user } = useAuth();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSlots() {
    try {
      setLoading(true);

      const { data, error } = await getAvailableSlots();

      if (error) {
        setMessage(`Error cargando horarios: ${error.message}`);
        return;
      }

      setSlots(data ?? []);
    } catch {
      setMessage("Ocurrió un error al cargar los horarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  async function handleBookAppointment(slot: Slot) {
    if (!user) {
      setMessage("Debes iniciar sesión para reservar una cita.");
      return;
    }

    if (isOnline) {
      const { error: appointmentError } = await createAppointment({
        patient_id: user.id,
        slot_id: slot.id,
        status: "pending",
      });

      if (appointmentError) {
        setMessage(`Error al reservar cita: ${appointmentError.message}`);
        return;
      }

      const { error: slotError } = await markSlotAsUnavailable(slot.id);

      if (slotError) {
        setMessage(
          `La cita se creó, pero no se actualizó el horario: ${slotError.message}`
        );
        return;
      }

      setMessage(
        `Cita reservada correctamente para ${slot.specialty} el ${slot.date} a las ${slot.time}.`
      );

      await loadSlots();
      return;
    }

    await addPendingAction({
      type: "BOOK_APPOINTMENT",
      payload: {
        appointmentId: 0,
        specialty: slot.specialty,
        doctor: "Por asignar",
        date: slot.date,
        time: slot.time,
      },
      createdAt: new Date().toISOString(),
    });

    setMessage(
      "Sin conexión. La solicitud quedó guardada y se enviará cuando vuelva internet."
    );
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <AppHeader
          title="Agenda de citas"
          subtitle="Selecciona un horario médico disponible para reservar tu atención."
        />

        {message && (
          <div
            className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${
              isOnline
                ? "border border-emerald-100 bg-emerald-50 text-slate-700"
                : "border border-amber-100 bg-amber-50 text-slate-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card title="Listado de horas">
              {loading ? (
                <p className="text-slate-500">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No hay horarios disponibles por ahora.
                </div>
              ) : (
                <div className="grid gap-4">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-800">
                            {slot.specialty}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {slot.date} · {slot.time}
                          </p>
                        </div>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Disponible
                        </span>
                      </div>

                      <Button type="button" onClick={() => handleBookAppointment(slot)}>
                        Reservar cita
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Estado actual">
              <div
                className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isOnline
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isOnline ? "Con conexión" : "Sin conexión"}
              </div>

              <p className="text-sm leading-6 text-slate-500">
                {isOnline
                  ? "Tus reservas se enviarán inmediatamente al sistema."
                  : "Puedes seguir reservando. Las solicitudes quedarán pendientes hasta recuperar internet."}
              </p>
            </Card>

            <Card title="Resumen">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Horas disponibles</p>
                <p className="mt-1 text-2xl font-black text-slate-800">
                  {loading ? "..." : slots.length}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}