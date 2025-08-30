"use client";
import { useEffect, useState } from "react";
import seed from "@/data/courses.seed.json";
import type { StoredCourse } from "@/lib/storage";
import { loadCourses, saveCourses } from "@/lib/storage";

export default function Seed() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const current = loadCourses();
    if (current.length === 0) {
      saveCourses(seed as unknown as StoredCourse[]);
    }
    setDone(true);
  }, []);
  return done ? null : null;
}
