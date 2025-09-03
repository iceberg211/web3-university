"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchCoursesList, type CourseSummary } from "@/lib/courses";

export function useCoursesList() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCoursesList();
      setCourses(list);
    } catch (e) {
      setError(e as Error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchCoursesList();
        if (mounted) setCourses(list);
      } catch (e) {
        if (mounted) setError(e as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { courses, loading, error, refetch: load } as const;
}

