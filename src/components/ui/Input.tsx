import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export default function Input({
  label,
  id,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={id}
        className={`w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 shadow-[0_8px_25px_rgba(15,23,42,0.05)] backdrop-blur transition focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 ${className}`}
        {...props}
      />

      {error && (
        <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}