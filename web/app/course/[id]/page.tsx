"use client";
import { useParams } from "next/navigation";
import BuyButton from "@/components/buy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourse, useOwnedCourse } from "@/hooks/useCourse";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { course, isLoading, error } = useCourse(id);
  const owned = useOwnedCourse(id);

  if (isLoading) return <div className="text-sm text-muted-foreground">加载课程中...</div>;
  if (error) return <div className="text-sm text-red-600">加载失败：{error.message}</div>;
  if (!course) return <div>课程不存在</div>;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {owned.isLoading ? (
            <p className="muted">查询购买状态中...</p>
          ) : !owned.data ? (
            <div className="space-y-3">
              <p className="text-red-600">未购买，无权限查看内容。</p>
              <BuyButton id={course.id} priceYD={course.priceYD} />
            </div>
          ) : (
            <article className="prose">
              <p>{course.summary}</p>
              <p>这里展示课程内容（存储在 Web2/localStorage）。</p>
            </article>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
