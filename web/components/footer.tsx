export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-[var(--border)]">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
        <span>© {year} Web3大学 · Monochrome</span>
        <div className="flex items-center gap-4">
          <a href="/exchange" className="hover:underline">兑换</a>
          <a href="/author/new" className="hover:underline">作者平台</a>
        </div>
      </div>
    </footer>
  );
}

