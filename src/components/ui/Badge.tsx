import type { ReactNode } from "react";

const VARIANTS = {
  neutral: "bg-white/10 text-foreground",
  success: "bg-accent/20 text-accent",
  danger: "bg-red-500/20 text-red-400",
  warning: "bg-yellow-500/20 text-yellow-400",
} as const;

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}
