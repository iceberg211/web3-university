import { SVGProps } from "react";

function withSize(props: SVGProps<SVGSVGElement>) {
  const { width = 18, height = 18, ...rest } = props;
  return { width, height, ...rest } as SVGProps<SVGSVGElement>;
}

export function IconSwap(props: SVGProps<SVGSVGElement>) {
  const p = withSize(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M7 10H17l-3-3" />
      <path d="M17 14H7l3 3" />
    </svg>
  );
}

export function IconPlusCircle(props: SVGProps<SVGSVGElement>) {
  const p = withSize(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function IconBook(props: SVGProps<SVGSVGElement>) {
  const p = withSize(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
      <path d="M6 3v16" />
    </svg>
  );
}

export function IconSparkles(props: SVGProps<SVGSVGElement>) {
  const p = withSize(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5L12 3z" />
      <path d="M19 14l.8 1.7L22 16l-1.7.7L19 18l-.7-1.3L16 16l1.3-.3L19 14z" />
    </svg>
  );
}

export function IconShield(props: SVGProps<SVGSVGElement>) {
  const p = withSize(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
    </svg>
  );
}

export function IconZap(props: SVGProps<SVGSVGElement>) {
  const p = withSize(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M13 2L3 14h7l-1 8 11-12h-7l0-8z" />
    </svg>
  );
}

