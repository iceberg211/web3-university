import { PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={[
        "rounded-[var(--radius)] border border-[var(--border)] bg-white dark:bg-neutral-950",
        "shadow-[0_1px_0_0_rgba(0,0,0,0.04)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={["px-5 pt-5", className].join(" ")}>{children}</div>;
}

export function CardTitle({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <h3 className={["text-base font-semibold tracking-tight", className].join(" ")}>{children}</h3>
  );
}

export function CardContent({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={["px-5 pb-5", className].join(" ")}>{children}</div>;
}

