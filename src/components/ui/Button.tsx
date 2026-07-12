import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:brightness-105",
  secondary: "bg-white/10 text-foreground hover:bg-white/20",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button
      className={`rounded-full px-6 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
