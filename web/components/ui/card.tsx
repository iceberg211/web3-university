import { PropsWithChildren } from "react";

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={[
        "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--elev)] dark:bg-neutral-950",
        "shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200",
        "hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={["px-6 pt-6", className].join(" ")}>{children}</div>;
}

export function CardTitle({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <h3 className={["text-base font-semibold tracking-tight", className].join(" ")}>{children}</h3>
  );
}

export function CardContent({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={["px-6 pb-6", className].join(" ")}>{children}</div>;
}

