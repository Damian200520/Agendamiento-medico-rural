import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import AppHeader from "../components/layout/AppHeader";
import { useAuth } from "../context/AuthContext";
import {
  getAllAppointments,
  getProfilesByIds,
  getSlotsByIds,
} from "../services/adminAppointmentService";
import { confirmAppointment } from "../services/appointmentService";
import { createAvailabilitySlot } from "../services/slotService";

type AppointmentRow = {
  id: string;
  patient_id: string;
  slot_id: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  role: string;
};

type SlotRow = {
  id: string;
  specialty: string;
  date: string;
  time: string;
};

type AdminAppointment = {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  patientName: string;
  specialty: string;
  date: string;
  time: string;
};

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [message, setMessage] = useState("");

  const [scheduleForm, setScheduleForm] = useState({
    specialty: "",
    date: "",
    time: "",
  });

  const [scheduleErrors, setScheduleErrors] = useState({
    specialty: "",
    date: "",
    time: "",
  });

  const [creatingSlot, setCreatingSlot] = useState(false);

  async function loadAppointments() {
    try {
      setLoadingAppointments(true);
      setMessage("");

      const { data: appointmentsData, error: appointmentsError } =
        await getAllAppointments();

      if (appointmentsError) {
        setMessage(`No se pudieron cargar las citas: ${appointmentsError.message}`);
        return;
      }

      const appointmentRows = (appointmentsData ?? []) as AppointmentRow[];
      const patientIds = appointmentRows.map((appointment) => appointment.patient_id);
      const slotIds = appointmentRows.map((appointment) => appointment.slot_id);

      const { data: profilesData, error: profilesError } =
        await getProfilesByIds(patientIds);

      if (profilesError) {
        setMessage(`No se pudieron cargar los pacientes: ${profilesError.message}`);
        return;
      }

      const { data: slotsData, error: slotsError } = await getSlotsByIds(slotIds);

      if (slotsError) {
        setMessage(`No se pudieron cargar los horarios: ${slotsError.message}`);
        return;
      }

      const profilesMap = new Map(
        ((profilesData ?? []) as ProfileRow[]).map((item) => [item.id, item])
      );

      const slotsMap = new Map(
        ((slotsData ?? []) as SlotRow[]).map((item) => [item.id, item])
      );

      const mergedAppointments: AdminAppointment[] = appointmentRows.map(
        (appointment) => ({
          id: appointment.id,
          status: appointment.status,
          patientName:
            profilesMap.get(appointment.patient_id)?.full_name ?? "Paciente sin dato",
          specialty:
            slotsMap.get(appointment.slot_id)?.specialty ?? "Especialidad sin dato",
          date: slotsMap.get(appointment.slot_id)?.date ?? "Fecha sin dato",
          time: slotsMap.get(appointment.slot_id)?.time ?? "Hora sin dato",
        })
      );

      setAppointments(mergedAppointments);
    } catch {
      setMessage("Ocurrió un error al cargar el panel administrativo.");
    } finally {
      setLoadingAppointments(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function handleScheduleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { id, value } = e.target;
    setScheduleForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleCreateSlot(e: React.FormEvent) {
    e.preventDefault();

    const newErrors = {
      specialty: "",
      date: "",
      time: "",
    };

    if (!scheduleForm.specialty.trim()) {
      newErrors.specialty = "Debes ingresar la especialidad.";
    }

    if (!scheduleForm.date.trim()) {
      newErrors.date = "Debes seleccionar una fecha.";
    }

    if (!scheduleForm.time.trim()) {
      newErrors.time = "Debes seleccionar una hora.";
    }

    setScheduleErrors(newErrors);

    if (newErrors.specialty || newErrors.date || newErrors.time) return;

    if (!user) {
      setMessage("No se encontró la sesión del usuario.");
      return;
    }

    try {
      setCreatingSlot(true);

      const { error } = await createAvailabilitySlot({
        staff_id: user.id,
        specialty: scheduleForm.specialty,
        date: scheduleForm.date,
        time: scheduleForm.time,
      });

      if (error) {
        setMessage(`No se pudo crear el horario: ${error.message}`);
        return;
      }

      setMessage("Horario creado correctamente.");

      setScheduleForm({
        specialty: "",
        date: "",
        time: "",
      });
    } catch {
      setMessage("Ocurrió un error al crear el horario.");
    } finally {
      setCreatingSlot(false);
    }
  }

  async function handleConfirmAppointment(appointmentId: string) {
    const { error } = await confirmAppointment(appointmentId);

    if (error) {
      setMessage(`No se pudo confirmar la cita: ${error.message}`);
      return;
    }

    setMessage("La cita fue confirmada correctamente.");
    await loadAppointments();
  }

  function getStatusLabel(status: AdminAppointment["status"]) {
    if (status === "confirmed") return "Confirmada";
    if (status === "cancelled") return "Cancelada";
    return "Pendiente";
  }

  function getStatusClasses(status: AdminAppointment["status"]) {
    if (status === "confirmed") {
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    }

    if (status === "cancelled") {
      return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
    }

    return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }

  const sortedAppointments = useMemo(() => {
    const statusOrder = {
      pending: 0,
      confirmed: 1,
      cancelled: 2,
    };

    return [...appointments].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      const aDate = new Date(`${a.date}T${a.time}:00`);
      const bDate = new Date(`${b.date}T${b.time}:00`);

      if (Number.isNaN(aDate.getTime()) || Number.isNaN(bDate.getTime())) {
        return 0;
      }

      return aDate.getTime() - bDate.getTime();
    });
  }, [appointments]);

  const pendingAppointments = sortedAppointments.filter(
    (appointment) => appointment.status === "pending"
  );

  const confirmedAppointments = sortedAppointments.filter(
    (appointment) => appointment.status === "confirmed"
  );

  const cancelledAppointments = sortedAppointments.filter(
    (appointment) => appointment.status === "cancelled"
  );

  function AppointmentItem({
    appointment,
    showConfirmButton = false,
  }: {
    appointment: AdminAppointment;
    showConfirmButton?: boolean;
  }) {
    return (
      <div className="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-blue-700 text-lg font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)]">
              +
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">
                {appointment.patientName}
              </h3>

              <div className="mt-2 grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Especialidad
                  </span>
                  <span className="mt-1 block font-medium text-slate-700">
                    {appointment.specialty}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Fecha
                  </span>
                  <span className="mt-1 block font-medium text-slate-700">
                    {appointment.date}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Hora
                  </span>
                  <span className="mt-1 block font-medium text-slate-700">
                    {appointment.time}
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

            {showConfirmButton && (
              <div className="w-full md:w-[170px]">
                <Button
                  type="button"
                  onClick={() => handleConfirmAppointment(appointment.id)}
                >
                  Confirmar cita
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
          title="Panel administrativo"
          subtitle="Gestiona solicitudes, confirma citas y crea horarios disponibles para atención médica."
        />

        {message && (
          <div className="mb-4 rounded-[1.5rem] border border-blue-100 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
            {message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card title="Crear horario disponible">
              <form onSubmit={handleCreateSlot} className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input
                    id="specialty"
                    type="text"
                    label="Especialidad"
                    placeholder="Ej: Medicina General"
                    value={scheduleForm.specialty}
                    onChange={handleScheduleChange}
                    error={scheduleErrors.specialty}
                  />
                </div>

                <Input
                  id="date"
                  type="date"
                  label="Fecha"
                  value={scheduleForm.date}
                  onChange={handleScheduleChange}
                  error={scheduleErrors.date}
                />

                <Input
                  id="time"
                  type="time"
                  label="Hora"
                  value={scheduleForm.time}
                  onChange={handleScheduleChange}
                  error={scheduleErrors.time}
                />

                <div className="md:col-span-2">
                  <Button type="submit" disabled={creatingSlot}>
                    {creatingSlot ? "Creando horario..." : "Crear horario"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card title="Citas pendientes">
              {loadingAppointments ? (
                <p className="text-slate-500">Cargando citas...</p>
              ) : pendingAppointments.length === 0 ? (
                <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5 text-sm text-slate-500 ring-1 ring-slate-100">
                  No hay citas pendientes.
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingAppointments.map((appointment) => (
                    <AppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                      showConfirmButton={true}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Citas confirmadas">
              {loadingAppointments ? (
                <p className="text-slate-500">Cargando citas...</p>
              ) : confirmedAppointments.length === 0 ? (
                <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-white p-5 text-sm text-slate-500 ring-1 ring-slate-100">
                  No hay citas confirmadas.
                </div>
              ) : (
                <div className="grid gap-4">
                  {confirmedAppointments.map((appointment) => (
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
                  No hay citas canceladas.
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
            <Card title="Resumen del día">
              <div className="grid gap-3">
                <div className="overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-[0_14px_30px_rgba(245,158,11,0.18)]">
                  <p className="text-sm text-amber-50">Pendientes</p>
                  <p className="mt-1 text-3xl font-black">{pendingAppointments.length}</p>
                </div>

                <div className="rounded-[1.5rem] bg-emerald-50/90 p-4 ring-1 ring-emerald-100 backdrop-blur">
                  <p className="text-sm text-emerald-600">Confirmadas</p>
                  <p className="mt-1 text-3xl font-black text-emerald-700">
                    {confirmedAppointments.length}
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
          </div>
        </div>
      </div>
    </main>
  );
}