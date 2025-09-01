import CourseCard from "@/components/course-card";
import { loadCourses } from "@/lib/storage";
import Seed from "@/components/seed";
import { Card, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Link from "next/link";
import { IconBook, IconShield, IconSparkles, IconZap } from "@/components/icons";

export default function Home() {
  const courses = typeof window !== "undefined" ? loadCourses() : [];
  return (
    <div className="space-y-10">
      <Seed />
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">链上课程，简单拥有</h1>
          <p className="muted">黑白极简 · 透明结算 · 一次购买，永久可用</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-start gap-3 py-5">
              <div className="mt-1 text-neutral-900 dark:text-neutral-100"><IconSparkles width={20} height={20} /></div>
              <div>
                <div className="font-medium">体验优秀</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">极简设计，聚焦内容与学习效率。</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 py-5">
              <div className="mt-1 text-neutral-900 dark:text-neutral-100"><IconShield width={20} height={20} /></div>
              <div>
                <div className="font-medium">链上可信</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">购买凭证上链，所有权一目了然。</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 py-5">
              <div className="mt-1 text-neutral-900 dark:text-neutral-100"><IconZap width={20} height={20} /></div>
              <div>
                <div className="font-medium">快捷支付</div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">一键授权与购买，流畅无阻。</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courses.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-10 flex items-center justify-between gap-6 flex-col md:flex-row">
              <div className="flex items-start gap-4">
                <div className="mt-1"><IconBook width={24} height={24} /></div>
                <div>
                  <div className="text-lg font-medium">还没有课程</div>
                  <p className="muted">去作者平台创建一个课程，开始你的知识分享之旅。</p>
                </div>
              </div>
              <Link href="/author/new">
                <Button>去创建课程</Button>
              </Link>
            </CardContent>
          </Card>
        )}
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            id={c.id}
            title={c.title}
            summary={c.summary}
            priceYD={c.priceYD}
          />
        ))}
      </section>
    </div>
  );
}
