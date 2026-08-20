import { useEffect, useState } from "react";
import { DEFAULT_CATEGORIES, type Category } from "../data/catalog";
import { cloudSync } from "../utils/cloudSync";

const STORAGE_KEY = "vodyanoy_categories_v1";

/** Объединяет список, сохраняя порядок source; недостающие дефолтные — в конец. */
function merge(source: Category[]): Category[] {
  if (!source || source.length === 0) {
    return DEFAULT_CATEGORIES.map((c) => ({ ...c }));
  }
  const defaultsByKey = new Map(DEFAULT_CATEGORIES.map((d) => [d.key, d]));
  const seen = new Set<string>();
  const result: Category[] = [];
  for (const c of source) {
    if (!c || !c.key || seen.has(c.key)) continue;
    seen.add(c.key);
    const d = defaultsByKey.get(c.key);
    result.push(d ? { ...d, ...c, key: c.key } : { ...c });
  }
  return result;
}

export function useCategories() {
  // Категории и их картинки берём только из Supabase.
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">(
    "syncing"
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const cloud = await cloudSync.getCategories();
      if (!active) return;
      if (cloud === undefined) {
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(cached) && cached.length > 0)
          setCategories(merge(cached));
        setSyncStatus("error");
      } else if (cloud && cloud.length > 0) {
        const m = merge(cloud);
        setCategories(m);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
        setSyncStatus("synced");
      } else {
        // В облаке пусто — записываем базовые категории.
        const seed = DEFAULT_CATEGORIES.map((c) => ({ ...c }));
        setCategories(seed);
        const ok = await cloudSync.saveCategories(seed);
        if (ok) localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        setSyncStatus(ok ? "synced" : "error");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (next: Category[]) => {
    setCategories(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSyncStatus("syncing");
    const ok = await cloudSync.saveCategories(next);
    setSyncStatus(ok ? "synced" : "error");
  };

  const updateCategory = (key: string, patch: Partial<Category>) =>
    save(categories.map((c) => (c.key === key ? { ...c, ...patch, key: c.key } : c)));

  const addCategory = (category: Category) => save([...categories, category]);

  const deleteCategory = (key: string) =>
    save(categories.filter((c) => c.key !== key));

  const moveCategory = (key: string, dir: -1 | 1) => {
    const idx = categories.findIndex((c) => c.key === key);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[idx], next[target]] = [next[target], next[idx]];
    save(next);
  };

  const resetCategories = () => save(DEFAULT_CATEGORIES.map((c) => ({ ...c })));

  const refreshCategories = async () => {
    const cloud = await cloudSync.getCategories();
    if (cloud === undefined) {
      setSyncStatus("error");
      return false;
    }
    if (cloud && cloud.length > 0) {
      const m = merge(cloud);
      setCategories(m);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
      setSyncStatus("synced");
      return true;
    }
    return false;
  };

  return {
    categories,
    updateCategory,
    addCategory,
    deleteCategory,
    moveCategory,
    resetCategories,
    refreshCategories,
    categoriesLoading: loading,
    categoriesSyncStatus: syncStatus,
  };
}
export type { Category };
