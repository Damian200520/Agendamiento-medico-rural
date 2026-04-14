import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { signInWithEmail } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === "staff") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/patient", { replace: true });
      }
    }

    if (!loading && !user) {
      setSubmitting(false);
    }
  }, [loading, user, profile, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors = {
      email: "",
      password: "",
    };

    if (!form.email.trim()) newErrors.email = "Debes ingresar tu correo.";
    if (!form.password.trim()) newErrors.password = "Debes ingresar tu contraseña.";

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) return;

    try {
      setSubmitting(true);
      setMessage("Intentando iniciar sesión...");

      const { error } = await signInWithEmail(form.email, form.password);

      if (error) {
        setMessage(`Error al iniciar sesión: ${error.message}`);
        setSubmitting(false);
        return;
      }

      setMessage("Inicio de sesión correcto. Cargando perfil...");
    } catch {
      setMessage("Ocurrió un error inesperado al iniciar sesión.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="hidden lg:block">
          <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-10 text-white shadow-xl">
            <div className="mb-6 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              PWA de salud rural
            </div>

            <h1 className="text-4xl font-black leading-tight">
              Agendamiento Médico Rural
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-blue-50">
              Una plataforma simple, accesible y preparada para baja conectividad,
              diseñada para que pacientes y personal de salud gestionen citas de
              forma clara y confiable.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold">Accesibilidad</p>
                <p className="mt-1 text-sm text-blue-50">
                  Botones grandes, formularios claros y navegación simple.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold">Modo offline</p>
                <p className="mt-1 text-sm text-blue-50">
                  Guarda solicitudes pendientes cuando la conexión falla.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-md">
            <div className="mb-5 text-center lg:hidden">
              <div className="mx-auto mb-3 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                PWA de salud rural
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Agendamiento Médico Rural
              </h1>
            </div>

            <Card title="Iniciar sesión">
              <p className="mb-5 text-sm leading-6 text-slate-500">
                Ingresa para revisar tus citas o gestionar horarios médicos.
              </p>

              {message && (
                <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <Input
                  id="email"
                  type="email"
                  label="Correo electrónico"
                  placeholder="nombre@correo.cl"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                />

                <Input
                  id="password"
                  type="password"
                  label="Contraseña"
                  placeholder="Ingresa tu contraseña"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                />

                <Button type="submit" disabled={submitting}>
                  {submitting ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>

              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
                ¿No tienes cuenta?{" "}
                <Link to="/register" className="font-semibold text-blue-700 hover:underline">
                  Crear cuenta
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}