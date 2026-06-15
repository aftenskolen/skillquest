"use client";
import { useFormStatus } from "react-dom";

interface Props {
  label: string;
  loadingLabel?: string;
  variant?: "primary" | "danger";
}

export function SubmitButton({ label, loadingLabel, variant = "primary" }: Props) {
  const { pending } = useFormStatus();
  const base = "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50";
  const styles =
    variant === "danger"
      ? `${base} bg-red-600 text-white hover:bg-red-700`
      : `${base} bg-[#1B3A5C] text-white hover:bg-[#162f4a]`;
  return (
    <button type="submit" disabled={pending} className={styles}>
      {pending ? (loadingLabel ?? "Lagrer…") : label}
    </button>
  );
}
