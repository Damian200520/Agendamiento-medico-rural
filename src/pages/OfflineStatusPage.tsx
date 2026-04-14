import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useNetworkStatus from "../hooks/useNetworkStatus";
import {
  clearPendingActions,
  getPendingActionsCount,
} from "../db/offlineQueue";

export default function OfflineStatusPage() {
  const isOnline = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [message, setMessage] = useState("");

  async function loadPendingCount() {
    const count = await getPendingActionsCount();
    setPendingCount(count);
  }

  useEffect(() => {
    loadPendingCount();
  }, []);

  async function handleRetrySync() {
    if (!isOnline) {
      setMessage("No se puede sincronizar mientras no haya conexión a internet.");
      return;
    }

    if (pendingCount === 0) {
      setMessage("No hay solicitudes pendientes por sincronizar.");
      return;
    }

    await clearPendingActions();
    await loadPendingCount();
    setMessage("Las solicitudes pendientes se sincronizaron correctamente.");
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-[2rem] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl">
          <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            Estado offline
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Conectividad y sincronización
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-orange-50">
            Consulta el estado de tu conexión y revisa si existen solicitudes pendientes.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-slate-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card title="Estado de conectividad">
              <div
                className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isOnline
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isOnline ? "Con conexión a internet" : "Sin conexión a internet"}
              </div>

              <p className="text-sm leading-7 text-slate-500">
                {isOnline
                  ? "El sistema puede sincronizar normalmente tus acciones pendientes."
                  : "La aplicación puede seguir mostrando información guardada localmente. Las nuevas acciones se almacenarán hasta recuperar la conexión."}
              </p>
            </Card>

            <Card title="Sincronización pendiente">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Solicitudes pendientes</p>
                  <p className="mt-1 text-2xl font-black text-slate-800">
                    {pendingCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Estado actual</p>
                  <p className="mt-1 text-2xl font-black text-slate-800">
                    {isOnline ? "Listo" : "En espera"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Button type="button" onClick={handleRetrySync}>
                  Reintentar sincronización
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Consejo">
              <p className="text-sm leading-6 text-slate-500">
                Cuando no haya señal, puedes seguir usando funciones básicas. El sistema
                guardará localmente las acciones pendientes para enviarlas más tarde.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}