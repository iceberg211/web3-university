"use client";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const stylesByVariant: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-neutral-900 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:bg-neutral-300 disabled:text-neutral-600 disabled:transform-none disabled:shadow-none",
  secondary:
    "bg-white text-black border border-neutral-200 hover:border-neutral-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:transform-none disabled:shadow-none",
  ghost:
    "bg-transparent text-black hover:bg-neutral-100 hover:-translate-y-0.5 active:translate-y-0 disabled:text-neutral-400 disabled:transform-none dark:text-white dark:hover:bg-neutral-800",
};

const stylesBySize: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius)] font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
          "transform active:scale-95",
          stylesByVariant[variant],
          stylesBySize[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;

