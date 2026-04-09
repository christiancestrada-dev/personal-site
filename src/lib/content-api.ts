// Static imports — baked into the client bundle at build time
import homeContent from "../../data/home-content.json";
import nowData from "../../data/now.json";
import linksData from "../../data/links.json";
import projectsData from "../../data/projects.json";
import readingExtra from "../../data/reading-extra.json";
import thingsData from "../../data/things.json";
import thingsSubtitle from "../../data/things-subtitle.json";
import thingsCategories from "../../data/things-categories.json";

const STATIC_DATA: Record<string, unknown> = {
  "home-content": homeContent,
  now: nowData,
  links: linksData,
  projects: projectsData,
  "reading-extra": readingExtra,
  things: thingsData,
  "things-subtitle": thingsSubtitle,
  "things-categories": thingsCategories,
};

export async function loadContent<T>(key: string): Promise<T | null> {
  // In dev, fetch from the API so we get the latest saved file
  if (process.env.NODE_ENV === "development") {
    try {
      const res = await fetch(`/api/content/${key}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      // fall through to static
    }
  }

  // In production (or if dev fetch fails), use the static import
  const data = STATIC_DATA[key];
  return (data as T) ?? null;
}

export async function saveContent<T>(key: string, data: T): Promise<void> {
  try {
    await fetch(`/api/content/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // silent fail in production — writes only work in dev
  }
}
