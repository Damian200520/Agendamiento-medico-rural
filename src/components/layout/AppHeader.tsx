import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { profile, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  const roleLabel =
    profile?.role === "staff" ? "Personal médico / administrativo" : "Paciente";

  return (
    <header className="mb-6 rounded-[2rem] bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-600 p-5 text-white shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            Agendamiento Médico Rural
          </div>

          <h1 className="text-3xl font-black tracking-tight">{title}</h1>

          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm text-slate-100">{subtitle}</p>
          )}
        </div>

        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm lg:min-w-[280px]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
            Sesión activa
          </p>

          <p className="mt-2 text-base font-bold text-white">
            {profile?.full_name ?? "Usuario"}
          </p>

          <p className="mt-1 text-sm text-slate-200">{roleLabel}</p>

          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}