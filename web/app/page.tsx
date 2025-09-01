import CourseCard from "@/components/course-card";
import { loadCourses } from "@/lib/storage";
import Seed from "@/components/seed";

export default function Home() {
  const courses = typeof window !== "undefined" ? loadCourses() : [];
  return (
    <div className="space-y-8">
      <Seed />
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          链上课程，简单拥有
        </h1>
        <p className="muted">使用黑白极简风格，专注知识与体验。</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courses.length === 0 && (
          <p className="muted">暂无课程，请前往作者平台创建。</p>
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
