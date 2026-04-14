import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { signUpWithEmail } from "../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "patient" as "patient" | "staff",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors = {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      role: "",
    };

    if (!form.fullName.trim()) newErrors.fullName = "Debes ingresar tu nombre completo.";
    if (!form.email.trim()) newErrors.email = "Debes ingresar tu correo.";

    if (!form.password.trim()) {
      newErrors.password = "Debes ingresar una contraseña.";
    } else if (form.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (!form.phone.trim()) newErrors.phone = "Debes ingresar tu teléfono.";
    if (!form.role) newErrors.role = "Debes seleccionar un rol.";

    setErrors(newErrors);

    if (
      newErrors.fullName ||
      newErrors.email ||
      newErrors.password ||
      newErrors.phone ||
      newErrors.role
    ) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const { error } = await signUpWithEmail(form.email, form.password, {
        full_name: form.fullName,
        phone: form.phone,
        role: form.role,
      });

      if (error) {
        setMessage(`Error al registrar: ${error.message}`);
        return;
      }

      setMessage("Cuenta creada correctamente.");
      setTimeout(() => navigate("/"), 1500);
    } catch {
      setMessage("Ocurrió un error inesperado al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Registro de usuario
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Completa tus datos para usar el sistema.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card>
            {message && (
              <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-slate-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-1 md:grid-cols-2 md:gap-4">
              <div className="md:col-span-2">
                <Input
                  id="fullName"
                  type="text"
                  label="Nombre completo"
                  placeholder="Escribe tu nombre"
                  value={form.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  id="email"
                  type="email"
                  label="Correo electrónico"
                  placeholder="nombre@correo.cl"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                />
              </div>

              <Input
                id="password"
                type="password"
                label="Contraseña"
                placeholder="Crea una contraseña"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />

              <Input
                id="phone"
                type="tel"
                label="Teléfono"
                placeholder="Ej: 912345678"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
              />

              <div className="mb-4 md:col-span-2">
                <label
                  htmlFor="role"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Rol
                </label>

                <select
                  id="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <option value="patient">Paciente</option>
                  <option value="staff">Personal médico / administrativo</option>
                </select>

                {errors.role && (
                  <p className="mt-2 text-sm font-medium text-red-600">{errors.role}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </div>
            </form>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
              ¿Ya tienes cuenta?{" "}
              <Link to="/" className="font-semibold text-blue-700 hover:underline">
                Iniciar sesión
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}