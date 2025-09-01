import Link from "next/link";
import WalletConnect from "@/components/wallet-connect";
import { IconSwap, IconPlusCircle, IconUser } from "@/components/icons";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:var(--background)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--background)]/70">
      <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">Web3大学</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/exchange" className="inline-flex items-center gap-2">
            <IconSwap /> 兑换 YD
          </Link>
          <Link href="/author/new" className="inline-flex items-center gap-2">
            <IconPlusCircle /> 作者平台
          </Link>
          <Link href="/me" className="inline-flex items-center gap-2">
            <IconUser /> 个人中心
          </Link>
          <WalletConnect />
        </nav>
      </div>
    </header>
  );
}
