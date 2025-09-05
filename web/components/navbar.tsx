import Link from "next/link";
import WalletConnect from "@/components/wallet-connect";
import { IconSwap, IconPlusCircle, IconUser } from "@/components/icons";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:var(--background)]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[color:var(--background)]/80">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight hover:scale-105 transition-transform duration-200">
          Web3大学
        </Link>
        <nav className="flex items-center gap-8 text-sm">
          <Link href="/exchange" className="inline-flex items-center gap-2 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors hover-lift">
            <IconSwap className="w-4 h-4" /> 兑换 / 质押
          </Link>
          <Link href="/author/new" className="inline-flex items-center gap-2 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors hover-lift">
            <IconPlusCircle className="w-4 h-4" /> 作者平台
          </Link>
          <Link href="/me" className="inline-flex items-center gap-2 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors hover-lift">
            <IconUser className="w-4 h-4" /> 个人中心
          </Link>
          <WalletConnect />
        </nav>
      </div>
    </header>
  );
}
