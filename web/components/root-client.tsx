"use client";
import { ReactNode } from "react";
import Providers from "@/components/providers";

export default function ClientRoot({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}

