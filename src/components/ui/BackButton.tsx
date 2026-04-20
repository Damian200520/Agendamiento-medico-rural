import { useNavigate } from "react-router-dom";

type BackButtonProps = {
  label?: string;
};

export default function BackButton({ label = "Volver" }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_8px_25px_rgba(15,23,42,0.06)] backdrop-blur transition hover:bg-white"
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}