import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-hover disabled:bg-primary/60",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
  destructive: "bg-danger text-white hover:bg-red-800 disabled:bg-danger/60",
  ghost: "text-slate-700 hover:bg-slate-100",
  link: "text-primary underline-offset-4 hover:underline px-0 h-auto",
  whatsapp: "bg-[#128c4b] text-white hover:bg-[#0f7a41]",
} as const;

const SIZES = {
  default: "h-11 px-4 text-base",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-11 w-11 p-0",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "default", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-70 [&_svg]:size-5 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
