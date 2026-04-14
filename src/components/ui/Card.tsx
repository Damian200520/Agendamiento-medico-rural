import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
};

export default function Card({ title, children }: CardProps) {
  return (
    <section className="rounded-[2rem] border border-white/60 bg-white/72 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      {title && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.7)]" />
            <h2 className="text-xl font-bold tracking-tight text-slate-800">
              {title}
            </h2>
          </div>

          <div className="mt-3 h-px w-full bg-gradient-to-r from-slate-200 via-slate-100 to-transparent" />
        </div>
      )}

      {children}
    </section>
  );
}