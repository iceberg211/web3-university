export type StoredCourse = {
  id: string;
  title: string;
  summary: string;
  priceYD: string; // string for UI input
};

const KEY = "courses.v1";

export function loadCourses(): StoredCourse[] {
  if (typeof window === "undefined") return [];
  const s = window.localStorage.getItem(KEY);
  if (!s) return [];
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}

export function saveCourses(courses: StoredCourse[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(courses));
}
