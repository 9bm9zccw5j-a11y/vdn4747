import { useEffect, useState } from "react";
import { DEFAULT_PRODUCTS, type Product } from "../data/catalog";
import { cloudSync } from "../utils/cloudSync";

const STORAGE_KEY = "vodyanoy_products_v1";

export function useProducts() {
  // Каталог берём только из Supabase — стартуем с пустого списка,
  // чтобы на экране не мелькали встроенные товары и их картинки.
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">(
    "syncing"
  );

  // Загрузка из облака один раз при старте.
  useEffect(() => {
    let active = true;
    (async () => {
      const cloud = await cloudSync.getProducts();
      if (!active) return;
      if (cloud === undefined) {
        // Ошибка сети/API — показываем последнюю копию, но не пишем её в облако.
        const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(cached) && cached.length > 0) setProducts(cached);
        setSyncStatus("error");
      } else if (cloud && cloud.length > 0) {
        setProducts(cloud);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud));
        setSyncStatus("synced");
      } else {
        // В облаке пусто — первичное наполнение базовым каталогом.
        const seed = DEFAULT_PRODUCTS.map((p) => ({ ...p }));
        setProducts(seed);
        const ok = await cloudSync.saveProducts(seed);
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

  const save = async (next: Product[]) => {
    setProducts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSyncStatus("syncing");
    const ok = await cloudSync.saveProducts(next);
    setSyncStatus(ok ? "synced" : "error");
  };

  const updateProduct = (id: number, patch: Partial<Product>) =>
    save(products.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addProduct = (p: Omit<Product, "id">) => {
    const nextId = Math.max(0, ...products.map((x) => x.id)) + 1;
    save([...products, { ...p, id: nextId }]);
  };

  const deleteProduct = (id: number) =>
    save(products.filter((p) => p.id !== id));

  /** Меняет местами позиции двух товаров в общем порядке каталога. */
  const swapProducts = (idA: number, idB: number) => {
    const idxA = products.findIndex((p) => p.id === idA);
    const idxB = products.findIndex((p) => p.id === idB);
    if (idxA === -1 || idxB === -1) return;
    const next = [...products];
    [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
    save(next);
  };

  const resetCatalog = () => save(DEFAULT_PRODUCTS.map((p) => ({ ...p })));

  const refreshProducts = async () => {
    const cloud = await cloudSync.getProducts();
    if (cloud === undefined) {
      setSyncStatus("error");
      return false;
    }
    if (cloud && cloud.length > 0) {
      setProducts(cloud);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud));
      setSyncStatus("synced");
      return true;
    }
    return false;
  };

  return {
    products,
    updateProduct,
    addProduct,
    deleteProduct,
    swapProducts,
    resetCatalog,
    refreshProducts,
    productsLoading: loading,
    productsSyncStatus: syncStatus,
  };
}
