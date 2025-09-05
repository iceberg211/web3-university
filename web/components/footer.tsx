export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-gradient-to-r from-transparent via-neutral-50/50 to-transparent dark:via-neutral-900/50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">Web3大学</span>
            <span>·</span>
            <span>Monochrome</span>
            <span>·</span>
            <span>© {year}</span>
          </div>
          <div className="flex items-center gap-6">
            <a 
              href="/exchange" 
              className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors hover-lift"
            >
              兑换 YD
            </a>
            <a 
              href="/author/new" 
              className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors hover-lift"
            >
              作者平台
            </a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-[var(--border)] text-center text-xs text-neutral-500 dark:text-neutral-400">
          极简设计 · 链上知识 · 透明的购买体验
        </div>
      </div>
    </footer>
  );
}

