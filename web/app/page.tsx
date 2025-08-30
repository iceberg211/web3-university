import Link from "next/link";
import WalletConnect from "@/components/wallet-connect";
import CourseCard from "@/components/course-card";
import { loadCourses } from "@/lib/storage";
import Seed from "@/components/seed";

export default function Home() {
  const courses = typeof window !== "undefined" ? loadCourses() : [];
  return (
    <div className="p-6 space-y-6">
      <Seed />
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Web3大学</h1>
        <div className="flex gap-4 items-center">
          <Link href="/exchange" className="underline">兑换YD币</Link>
          <Link href="/author/new" className="underline">作者平台</Link>
          <WalletConnect />
        </div>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.length === 0 && <p>暂无课程，请前往作者平台创建。</p>}
        {courses.map((c) => (
          <CourseCard key={c.id} id={c.id} title={c.title} summary={c.summary} priceYD={c.priceYD} />
        ))}
      </section>
    </div>
  );
}
