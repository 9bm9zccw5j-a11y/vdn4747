export interface MediaItem {
  id: string;
  name: string;
  dataUrl: string;
  sizeKB: number;
  createdAt: string;
}

import { useEffect, useState } from "react";
import { cloudSync } from "../utils/cloudSync";

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">(
    "syncing"
  );

  useEffect(() => {
    let active = true;
    (async () => {
      setSyncStatus("syncing");
      const cloud = await cloudSync.getMedia();
      if (!active) return;
      if (cloud === undefined) {
        setSyncStatus("error");
      } else if (cloud && cloud.length >= 0) {
        setItems(cloud);
        setSyncStatus("synced");
      } else {
        setSyncStatus("synced");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = async (next: MediaItem[]) => {
    setItems(next);
    setSyncStatus("syncing");
    const ok = await cloudSync.saveMedia(next);
    setSyncStatus(ok ? "synced" : "error");
  };

  const addItems = (newItems: MediaItem[]) => save([...newItems, ...items]);
  const deleteItem = (id: string) => save(items.filter((i) => i.id !== id));
  const clearAll = () => save([]);

  return { items, addItems, deleteItem, clearAll, syncStatus };
}
