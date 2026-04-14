import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "w-full rounded-2xl px-4 py-3.5 text-sm font-semibold border transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4 active:scale-[0.99]";

  const variantStyles =
    variant === "primary"
      ? "bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 text-white border-blue-600 hover:brightness-105 focus:ring-blue-200 shadow-[0_12px_30px_rgba(37,99,235,0.25)]"
      : variant === "danger"
      ? "bg-gradient-to-r from-red-600 to-rose-500 text-white border-red-600 hover:brightness-105 focus:ring-red-200 shadow-[0_12px_30px_rgba(220,38,38,0.22)]"
      : "bg-white/75 text-slate-700 border-white/70 hover:bg-white focus:ring-slate-200 shadow-[0_8px_25px_rgba(15,23,42,0.06)] backdrop-blur";

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    />
  );
}