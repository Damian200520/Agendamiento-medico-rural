import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import AppHeader from "../components/layout/AppHeader";
import useNetworkStatus from "../hooks/useNetworkStatus";
import { useAuth } from "../context/AuthContext";
import {
  getAppointmentsByPatientId,
  getSlotsByIds,
} from "../services/patientAppointmentService";
import {
  cancelAppointment,
  markSlotAsAvailable,
} from "../services/appointmentService";

type AppointmentRow = {
  id: string;
  patient_id: string;
  slot_id: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
};

type SlotRow = {
  id: string;
  specialty: string;
  date: string;
  time: string;
};

type PatientAppointment = {
  id: string;
  slot_id: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  slot: SlotRow | null;
};

export default function PatientDashboardPage() {
  const isOnline = useNetworkStatus();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [message, setMessage] = useState("");

  async function loadAppointments() {
    if (!user) {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }

    try {
      setLoadingAppointments(true);
      setMessage("");

      const { data: appointmentsData, error: appointmentsError } =
        await getAppointmentsByPatientId(user.id);

      if (appointmentsError) {
        setMessage(`No se pudieron cargar tus citas: ${appointmentsError.message}`);
        return;
      }

      const appointmentRows = (appointmentsData ?? []) as AppointmentRow[];
      const slotIds = appointmentRows.map((appointment) => appointment.slot_id);

      const { data: slotsData, error: slotsError } = await getSlotsByIds(slotIds);

      if (slotsError) {
        setMessage(
          `No se pudieron cargar los horarios de tus citas: ${slotsError.message}`
        );
        return;
      }

      const slotsMap = new Map(
        ((slotsData ?? []) as SlotRow[]).map((slot) => [slot.id, slot])
      );

      const mergedAppointments: PatientAppointment[] = appointmentRows.map(
        (appointment) => ({
          id: appointment.id,
          slot_id: appointment.slot_id,
          status: appointment.status,
          created_at: appointment.created_at,
          slot: slotsMap.get(appointment.slot_id) ?? null,
        })
      );

      setAppointments(mergedAppointments);
    } catch {
      setMessage("Ocurrió un error al cargar tus citas.");
    } finally {
      setLoadingAppointments(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, [user]);

  async function handleCancelAppointment(appointment: PatientAppointment) {
    const confirmCancel = window.confirm("¿Seguro que quieres cancelar esta cita?");
    if (!confirmCancel) return;

    const { error: cancelError } = await cancelAppointment(appointment.id);
    if (cancelError) {
      setMessage(`No se pudo cancelar la cita: ${cancelError.message}`);
      return;
    }

    const { error: slotError } = await markSlotAsAvailable(appointment.slot_id);
    if (slotError) {
      setMessage(
        `La cita fue cancelada, pero no se pudo liberar el horario: ${slotError.message}`
      );
      return;
    }

    setMessage("La cita fue cancelada correctamente.");
    await loadAppointments();
  }

  function getStatusLabel(status: PatientAppointment["status"]) {
    if (status === "confirmed") return "Confirmada";
    if (status === "cancelled") return "Cancelada";
    return "Pendiente";
  }

  function getStatusClasses(status: PatientAppointment["status"]) {
    if (status === "confirmed") {
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (status === "cancelled") {
      return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
    }

    return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }

  function getAppointmentDateTime(appointment: PatientAppointment) {
    if (!appointment.slot?.date || !appointment.slot?.time) return null;

    const dateTime = new Date(`${appointment.slot.date}T${appointment.slot.time}:00`);
    return Number.isNaN(dateTime.getTime()) ? null : dateTime;
  }

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aDate = getAppointmentDateTime(a);
      const bDate = getAppointmentDateTime(b);

      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;

      return aDate.getTime() - bDate.getTime();
    });
  }, [appointments]);

  const now = new Date();

  const upcomingAppointments = sortedAppointments.filter((appointment) => {
    if (appointment.status === "cancelled") return false;
    const appointmentDate = getAppointmentDateTime(appointment);
    if (!appointmentDate) return false;
    return appointmentDate.getTime() >= now.getTime();
  });

  const pastAppointments = sortedAppointments.filter((appointment) => {
    if (appointment.status === "cancelled") return false;
    const appointmentDate = getAppointmentDateTime(appointment);
    if (!appointmentDate) return false;
    return appointmentDate.getTime() < now.getTime();
  });

  const cancelledAppointments = sortedAppointments.filter(
    (appointment) => appointment.status === "cancelled"
  );

  function AppointmentItem({
    appointment,
    showCancelButton = false,
  }: {
    appointment: PatientAppointment;
    showCancelButton?: boolean;
  }) {
    return (
      <div className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
              +
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">
                {appointment.slot?.specialty ?? "Sin dato"}
              </h3>

              <div className="mt-2 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Fecha
                  </span>
                  <span className="mt-1 block font-medium text-slate-700">
                    {appointment.slot?.date ?? "Sin fecha"}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Hora
                  </span>
                  <span className="mt-1 block font-medium text-slate-700">
                    {appointment.slot?.time ?? "Sin hora"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                appointment.status
              )}`}
            >
              {getStatusLabel(appointment.status)}
            </span>

            {showCancelButton && (
              <div className="w-full md:w-[170px]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleCancelAppointment(appointment)}
                >
                  Cancelar cita
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <AppHeader
          title="Panel del paciente"
          subtitle="Revisa tus próximas atenciones, consulta tu historial y administra tus citas en un solo lugar."
        />

        {message && (
          <div className="mb-4 rounded-[1.5rem] border border-blue-100 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
            {message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card title="Mis próximas citas">
              {loadingAppointments ? (
                <p className="text-slate-500">Cargando citas...</p>
              ) : upcomingAppointments.length === 0 ? (
                <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5 text-sm text-slate-500 ring-1 ring-slate-100">
                  No tienes citas próximas.
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                      showCancelButton={true}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Citas pasadas">
              {loadingAppointments ? (
                <p className="text-slate-500">Cargando citas...</p>
              ) : pastAppointments.length === 0 ? (
                <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5 text-sm text-slate-500 ring-1 ring-slate-100">
                  No tienes citas pasadas.
                </div>
              ) : (
                <div className="grid gap-4">
                  {pastAppointments.map((appointment) => (
                    <AppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Citas canceladas">
              {loadingAppointments ? (
                <p className="text-slate-500">Cargando citas...</p>
              ) : cancelledAppointments.length === 0 ? (
                <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5 text-sm text-slate-500 ring-1 ring-slate-100">
                  No tienes citas canceladas.
                </div>
              ) : (
                <div className="grid gap-4">
                  {cancelledAppointments.map((appointment) => (
                    <AppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Estado de conexión">
              <div
                className={`mb-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isOnline
                    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                }`}
              >
                {isOnline ? "Con conexión" : "Sin conexión"}
              </div>

              <p className="text-sm leading-6 text-slate-500">
                {isOnline
                  ? "Tus acciones pueden sincronizarse normalmente y las actualizaciones se reflejan al instante."
                  : "Puedes seguir revisando datos guardados. Las nuevas acciones quedarán pendientes hasta recuperar internet."}
              </p>
            </Card>

            <Card title="Resumen">
              <div className="grid gap-3">
                <div className="overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-blue-600 to-cyan-500 p-4 text-white shadow-[0_14px_30px_rgba(37,99,235,0.18)]">
                  <p className="text-sm text-blue-100">Próximas</p>
                  <p className="mt-1 text-3xl font-black">{upcomingAppointments.length}</p>
                </div>

                <div className="rounded-[1.5rem] bg-white/75 p-4 ring-1 ring-white/70 backdrop-blur">
                  <p className="text-sm text-slate-500">Pasadas</p>
                  <p className="mt-1 text-3xl font-black text-slate-800">
                    {pastAppointments.length}
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-rose-50/90 p-4 ring-1 ring-rose-100 backdrop-blur">
                  <p className="text-sm text-rose-500">Canceladas</p>
                  <p className="mt-1 text-3xl font-black text-rose-700">
                    {cancelledAppointments.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Acciones rápidas">
              <div className="grid gap-3">
                <Link to="/appointments" className="no-underline">
                  <Button type="button">Agendar nueva cita</Button>
                </Link>

                <Link to="/offline-status" className="no-underline">
                  <Button type="button" variant="secondary">
                    Ver estado de conexión
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}