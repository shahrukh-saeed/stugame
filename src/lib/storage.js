const KEY = "stugame-courses";
export function loadCourses() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
export function saveCourses(courses) {
  localStorage.setItem(KEY, JSON.stringify(courses));
}
