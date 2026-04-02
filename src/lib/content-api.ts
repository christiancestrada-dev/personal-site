export async function loadContent<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`/api/content/${key}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveContent<T>(key: string, data: T): Promise<void> {
  try {
    await fetch(`/api/content/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // silent fail
  }
}
