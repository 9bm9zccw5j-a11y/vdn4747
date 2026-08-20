import { useEffect, useState } from "react";
import { cloudSync } from "../utils/cloudSync";

export interface LoyaltyReceipt {
  id: number;
  sum: number;
  img?: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}

export interface LoyaltyUser {
  id: string;
  phone: string; // нормализованный: 7XXXXXXXXXX
  firstName: string;
  lastName: string;
  receipts: LoyaltyReceipt[];
  cardNumber: string | null;
  status: "pending" | "active";
  createdAt: string;
}

export const LOYALTY_THRESHOLD = 25000;
export const LOYALTY_DISCOUNT = 0.05;

const LS_SESSION = "vodyanoy_loyalty_session_v1";

export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;
  return d;
}

export function formatPhone(d: string): string {
  if (d.length !== 11) return d;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
}

export function approvedSum(u: LoyaltyUser): number {
  return u.receipts
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.sum, 0);
}

export function pendingSum(u: LoyaltyUser): number {
  return u.receipts
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.sum, 0);
}

export function genCardNumber(users: LoyaltyUser[]): string {
  let n = "";
  do {
    n = `VDN-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  } while (users.some((u) => u.cardNumber === n));
  return n;
}

export function useLoyalty() {
  const [users, setUsers] = useState<LoyaltyUser[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem(LS_SESSION)
  );
  const [syncing, setSyncing] = useState(false);

  // Загрузка аккаунтов из облака (Supabase) один раз при старте.
  useEffect(() => {
    let active = true;
    (async () => {
      const cloud = await cloudSync.getLoyaltyUsers();
      if (!active) return;
      if (cloud && Array.isArray(cloud)) {
        setUsers(cloud);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const saveUsers = async (next: LoyaltyUser[]) => {
    setUsers(next);
    setSyncing(true);
    await cloudSync.saveLoyaltyUsers(next);
    setSyncing(false);
  };

  const currentUser = users.find((u) => u.id === sessionId) ?? null;

  const findUserByPhone = (phone: string) =>
    users.find((u) => u.phone === normalizePhone(phone)) ?? null;

  const register = (firstName: string, lastName: string, phone: string) => {
    const user: LoyaltyUser = {
      id: `u${Date.now()}`,
      phone: normalizePhone(phone),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      receipts: [],
      cardNumber: null,
      status: "pending",
      createdAt: new Date().toLocaleDateString("ru-RU"),
    };
    saveUsers([...users, user]);
    setSessionId(user.id);
    localStorage.setItem(LS_SESSION, user.id);
    return user;
  };

  const setSession = (id: string | null) => {
    setSessionId(id);
    if (id) localStorage.setItem(LS_SESSION, id);
    else localStorage.removeItem(LS_SESSION);
  };

  const addReceipt = (sum: number, img?: string) => {
    if (!currentUser) return;
    const next = users.map((u) =>
      u.id === currentUser.id
        ? {
            ...u,
            receipts: [
              ...u.receipts,
              {
                id: Date.now(),
                sum,
                img,
                status: "pending" as const,
                date: new Date().toLocaleDateString("ru-RU"),
              },
            ],
          }
        : u
    );
    saveUsers(next);
  };

  const setReceiptStatus = (
    userId: string,
    receiptId: number,
    status: LoyaltyReceipt["status"]
  ) => {
    const next = users.map((u) =>
      u.id === userId
        ? {
            ...u,
            receipts: u.receipts.map((r) =>
              r.id === receiptId ? { ...r, status } : r
            ),
          }
        : u
    );
    saveUsers(next);
  };

  const activateUser = (userId: string) => {
    const next = users.map((u) =>
      u.id === userId
        ? {
            ...u,
            status: "active" as const,
            cardNumber: u.cardNumber ?? genCardNumber(users),
          }
        : u
    );
    saveUsers(next);
  };

  return {
    users,
    currentUser,
    syncing,
    findUserByPhone,
    register,
    setSession,
    addReceipt,
    setReceiptStatus,
    activateUser,
  };
}
