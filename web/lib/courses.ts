import { supabase } from "@/lib/supabase";

export type CourseSummary = {
  id: string;
  title: string;
  summary: string;
  priceYD: string;
};

export async function fetchCoursesList(): Promise<CourseSummary[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id,title,summary,priceYD,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("Failed to load courses:", error.message);
    return [];
  }
  return (data || []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    summary: r.summary as string,
    priceYD: r.priceYD as string,
  }));
}

export async function fetchCoursesByIds(ids: string[]): Promise<CourseSummary[]> {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("courses")
    .select("id,title,summary,priceYD")
    .in("id", ids);
  if (error) {
    console.warn("Failed to load courses by ids:", error.message);
    return [];
  }
  return (data || []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    summary: r.summary as string,
    priceYD: r.priceYD as string,
  }));
}

